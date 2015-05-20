/*
 * Pitch-Dark - A GNOME Shell extension that forces all windows to use the dark GTK theme variant.
 * Copyright (C) 2015 Patrick Gaubatz <patrick@gaubatz.at>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const Glib = imports.gi.GLib;
const Shell = imports.gi.Shell;

const display = global.screen.get_display();

let listener = null;

function setDarkTheme(win) {
  let xid = !(win.skip_taskbar) && guessWindowXID(win);
  if (xid) {
    Glib.spawn_command_line_sync('xprop -f _GTK_THEME_VARIANT 8u -set _GTK_THEME_VARIANT dark -id ' + xid);
  }
}

function enable() {
  // set for any existing windows
  Shell.AppSystem.get_default().get_running()
    .forEach(function (app) {
      app.get_windows().forEach(function (win) {
        setDarkTheme(win);
      });
    });

  // ... and all future windows
  listener = display.connect_after('window-created', function (_, win) {
    setDarkTheme(win);
  });
}

function disable() {
  if (listener) {
    display.disconnect(listener);
    listener = null;
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
