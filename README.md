# dps-autodate

## Auto date writing.

### require.

-   [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
-   [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

## Sample config.

```vim
" This is the default setting.
let g:autodate_config = {
\ "*": {
\   "keywords": [
\     "Last Change.*: (?<date>)$",
\     "Updated: (?<date>)\."
\   ],
\   "events": ["BufWritePre"]
\ }
\ }
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
