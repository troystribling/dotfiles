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

" nerd tree
map <C-n> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

" ctrlp
set runtimepath^=~/.vim/bundle/ctrlp.vim
