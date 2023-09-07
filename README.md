# dps-autodate

Denops auto date.

Find specific keywords and set dates automatically.

- before
```
  Last Change: .
```

- after
```
  Last Change: 2022/06/09 16:59:43.
```

# Features 

dps-autodate is a Vim plugin that automatically set dates.

# Installation 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```lua
{
  "yukimemi/dps-autodate",
  lazy = false,
  dependencies = {
    "vim-denops/denops.vim",
  },
}
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```typescript
dvpm.add({ url: "yukimemi/dps-autodate" });
```

# Requirements 

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)
# Usage 

No special settings are required.
By default, `Last Change: .` keyword to `Last Change: yyyy/MM/dd HH:mm:ss.`.

# Commands 

`:DisableAutodate`                                          
Disable auto date.

`:EnableAutodate`                                            
Enable auto backup.

# Config 

No settings are required. However, the following settings can be made if necessary.

`g:autodate_debug`                                          
Enable debug messages.
default is v:false

`g:autodate_notify`                                        
Whether to `vim.notify` messages during autodate. (Neovim only)
default is v:false

`g:autodate_config`                                        
autodate configuration.
default setting is below.

```lua
vim.g.autodate_config = {
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
let g:autodate_config = {
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

Copyright (c) 2023 yukimemi

