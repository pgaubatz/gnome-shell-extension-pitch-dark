Pitch-Dark
==========

Pitch-Dark is GNOME Shell extension that forces all application windows to use the [dark GTK theme variant](https://developer.gnome.org/gtk3/3.0/GtkSettings.html#GtkSettings--gtk-application-prefer-dark-theme).

The most convenient way of installing this extension is using [extensions.gnome.org](https://extensions.gnome.org/extension/957/pitch-dark/).

The only prerequisite is the `xprop` utility which can easily be installed using:
- Debian/Ubuntu: `apt-get install x11-utils`
- Fedora: `yum install xorg-x11-utils`
- Arch: `pacman -S xorg-xprop`

You may also want to install the [Adwaita-dark-gtk2](https://github.com/axxapy/Adwaita-dark-gtk2) theme that provides a dark variant for Gtk2 applications. 

Before
------

![Before](http://pgaubatz.github.io/gnome-shell-extension-pitch-dark/before.png)

After
-----

![After](http://pgaubatz.github.io/gnome-shell-extension-pitch-dark/after.png)

Acknowledgement
---------------

It borrows the guessWindowXID function from [mathematicalcoffee's maximus extension](https://bitbucket.org/mathematicalcoffee/maximus-gnome-shell-extension).
