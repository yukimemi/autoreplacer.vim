# autoreplacer

Auto Replacer.

Find specific keywords and replace it automatically.

- before

```
  Last Change: .
```

- after

```
  Last Change: 2022/06/09 16:59:43.
```

# Features

autoreplacer is a Vim plugin that automatically replace words.

# Installation

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```lua
{
  "yukimemi/autoreplacer.vim",
  lazy = false,
  dependencies = {
    "vim-denops/denops.vim",
  },
}
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```typescript
dvpm.add({ url: "yukimemi/autoreplacer.vim" });
```

# Requirements

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

# Usage

No special settings are required.
By default, `Last Change: .` keyword to `Last Change: yyyy/MM/dd HH:mm:ss.`.

# Commands

`:DisableAutoReplacer`

Disable auto replacer.

`:EnableAutoReplacer`

Enable auto replacer.

# Config

No settings are required. However, the following settings can be made if necessary.

`g:autoreplacer_debug`
Enable debug messages.
default is v:false

`g:autoreplacer_notify`

Whether to `vim.notify` messages during autoreplacer. (Neovim only)
default is v:false

`g:autoreplacer_config`
autoreplacer configuration.
default setting is below.

```lua
vim.g.autoreplacer_config = {
  -- filetype. `*` is all filetype.
  ["*"] = {
    ["replace"] = {
      -- replace before (regexp pattern) to replace after.
      -- `now` is current date time.
      -- `format` is deno function. https://deno.land/std/datetime/format.ts
      { "/(.*Last Change.*: ).*\.$/i", "$1${format(now, "yyyy/MM/dd HH:mm:ss")}." },
    },
    -- replace events.
    ["events"] = { "BufWritePre" },
    -- replace file name pattern.
    ["pat"] = "*",
    -- How many lines from the beginning of the file to rewrite
    ["head"] = 13,
    -- How many lines from the end of the file to rewrite
    ["tail"] = 13,
  },
}
```

# Example

```vim
let g:autoreplacer_config = {
  \ "xml": {
  \   "replace": [
  \     ['/^(.*key="version">)[^<]*(<.*)/i', '$1${format(now, "yyyyMMdd_HHmmss")}$2']
  \   ],
  \   "event": ["BufWritePre"],
  \   "pat": ["*.xml", "*.xaml"],
  \   "head": 30,
  \   "tail": 5,
  \ }
  \ }
```

- before

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <func name="Set-Store">
    <set key="VERSION"></set>
  </func>
</root>
```

- after save

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <func name="Set-Store">
    <set key="VERSION">20220609_165708</set>
  </func>
</root>
```

# License

Licensed under MIT License.

Copyright (c) 2024 yukimemi
