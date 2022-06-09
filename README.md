# dps-autodate

## Auto date writing.

- Before.

```markdown
Last Change: .
```

- After save.

```markdown
Last Change: 2022/06/09 16:59:43.
```

### Require.

-   [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
-   [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

## Config.

No settings are required. However, the following settings can be made if necessary.

```vim
" This is the default setting.
let g:autodate_debug = v:false
let g:autodate_config = {
\ "*": {
\   "replace": [
\     ['/(.*Last Change.*: ).*\.$/i',
\     '$1${format(now, "yyyy/MM/dd HH:mm:ss")}.']
\   ],
\   "events": ["FileWritePre", "BufWritePre"],
\   "pat": "*",
\   "head": 13,
\   "tail": 13,
\ }
\ }
```

### Config description.

```vim
let g:autodate_config = {
\ "filetype": {                            # vim's filetype.
\   "replace": [['before', 'after'], ...], # replace patterns. -> Evaluate deno code: line.replace(before, after)
                                           # You can use the following values in after.
                                           #   now   : new Date()
                                           #   format: Deno format function (https://deno.land/std/datetime#format)
\   "events": "event",                     # Vim's autocmd events. String or List.
\   "pat": "aupat",                        # Vim's autocmd pattern. String or List.
\   "head": 13,                            # The number of lines searched from top.
\   "tail": 13,                            # The number of lines searched from bottom.
\ },
\ "filetype": ...
\ }
```

### Example.

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

- Before.

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
	<func name="Set-Store">
		<set key="VERSION"></set>
	</func>
</root>
```

- After save.

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
	<func name="Set-Store">
		<set key="VERSION">20220609_165708</set>
	</func>
</root>
```

## Commands.

```vim
" Disable autodate
:DisableAutodate

" Enable autodate
:EnableAutodate
```

---

This plugin is inspired by autodate ! Thank you !

[vim-scripts/autodate.vim: A customizable plugin to update time stamps automatically.](https://github.com/vim-scripts/autodate.vim)
