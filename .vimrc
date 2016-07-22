set nocompatible              " be iMproved, required
filetype off                  " required

" highlighting
syntax on
set number
set background=dark
set cursorline

" tabbing
set expandtab
set shiftwidth=2
set softtabstop=2
set backspace=indent,eol,start

" folding settings
set foldmethod=indent
set foldnestmax=10
set nofoldenable
set foldlevel=1

" pathogen
execute pathogen#infect()
syntax on
filetype plugin indent on
filetype plugin on

" nerd tree
map <C-n> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

" syntastic
let g:syntastic_swift_checkers = ['swiftpm', 'swiftlint']
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0

" ctrlp
let g:ctrlp_map = '<c-p>'
let g:ctrlp_cmd = 'CtrlP'
