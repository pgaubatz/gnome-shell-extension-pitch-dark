'use strict';

const Glib = imports.gi.GLib;
const display = global.screen.get_display();

let windowCreatedId = 0;

function enable() {
  windowCreatedId = display.connect_after('window-created', function (ignored, window) {
    if (!window.skip_taskbar) {
      let xid = guessWindowXID(window);
      if (xid) {
        Glib.spawn_command_line_sync('xprop -f _GTK_THEME_VARIANT 8u -set _GTK_THEME_VARIANT dark -id ' + xid);
      }
    }
  });
}

function disable() {
  if (windowCreatedId) {
    display.disconnect(windowCreatedId);
    windowCreatedId = 0;
  }
}

/** Guesses the X ID of a window.
 *
 * It is often in the window's title, being `"0x%x %10s".format(XID, window.title)`.
 * (See `mutter/src/core/window-props.c`).
 *
 * If we couldn't find it there, we use `win`'s actor, `win.get_compositor_private()`.
 * The actor's `x-window` property is the X ID of the window *actor*'s frame
 * (as opposed to the window itself).
 *
 * However, the child window of the window actor is the window itself, so by
 * using `xwininfo -children -id [actor's XID]` we can attempt to deduce the
 * window's X ID.
 *
 * It is not always foolproof, but works good enough for now.
 *
 * @param {Meta.Window} win - the window to guess the XID of. You wil get better
 * success if the window's actor (`win.get_compositor_private()`) exists.
 */
function guessWindowXID(win) {
  let id = null;
  /* if window title has non-utf8 characters, get_description() complains
   * "Failed to convert UTF-8 string to JS string: Invalid byte sequence in conversion input",
   * event though get_title() works.
   */
  try {
    id = win.get_description().match(/0x[0-9a-f]+/);
    if (id) {
      id = id[0];
      return id;
    }
  } catch (err) {
  }

  // use xwininfo, take first child.
  let act = win.get_compositor_private();
  if (act) {
    id = GLib.spawn_command_line_sync('xwininfo -children -id 0x%x'.format(act['x-window']));
    if (id[0]) {
      let str = id[1].toString();

      /* The X ID of the window is the one preceding the target window's title.
       * This is to handle cases where the window has no frame and so
       * act['x-window'] is actually the X ID we want, not the child.
       */
      let regexp = new RegExp('(0x[0-9a-f]+) +"%s"'.format(win.title));
      id = str.match(regexp);
      if (id) {
        return id[1];
      }

      /* Otherwise, just grab the child and hope for the best */
      id = str.split(/child(?:ren)?:/)[1].match(/0x[0-9a-f]+/);
      if (id) {
        return id[0];
      }
    }
  }
  // debugging for when people find bugs..
  log('Could not find XID for window with title %s'.format(win.title));
  return null;
}
