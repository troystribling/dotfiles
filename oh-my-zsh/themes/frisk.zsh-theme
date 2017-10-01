PROMPT=$'
%{$fg[yellow]%}%/%{$reset_color%} $(git_prompt_info)$(bzr_prompt_info)%{$fg_bold[cyan]%}%n@%m%{$reset_color%}
%{$fg_bold[black]%}>%{$reset_color%} '

PROMPT2="%{$fg_bold[black]%}%_> %{$reset_color%}"

GIT_CB="git::"
ZSH_THEME_SCM_PROMPT_PREFIX="%{$fg[green]%}["
ZSH_THEME_GIT_PROMPT_PREFIX=$ZSH_THEME_SCM_PROMPT_PREFIX$GIT_CB
ZSH_THEME_GIT_PROMPT_SUFFIX="]%{$reset_color%} "
ZSH_THEME_GIT_PROMPT_DIRTY=" %{$fg[red]%}*%{$fg[green]%}"
ZSH_THEME_GIT_PROMPT_CLEAN=""
