# zpty shell completion settings

typeset -gx CACHE_DIR=${XDG_CACHE_HOME:-"$HOME/.cache"}/ddc-source-shell_native

# Create cache directory if missing and fail loudly if creation fails.
if [[ ! -d $CACHE_DIR ]]; then
  mkdir -p -- "$CACHE_DIR" || { echo "error: failed to create cache dir: $CACHE_DIR" >&2; exit 1; }
fi

# Load completion system
autoload -U compinit
compinit -C -d "$CACHE_DIR/compdump"

# Setup options
HISTSIZE=0
unset HISTFILE
unset PROMPT
unset PROMPT2
unset PROMPT3
unset PROMPT4
unset RPROMPT
unset RPROMPT2
unsetopt beep
setopt ignore_eof
setopt single_line_zle

# Keybindings
bindkey -e
bindkey -rR '^@'-'^_'
bindkey -rp '^[' '^X'
bindkey -r '^?'
bindkey '^J' accept-line
bindkey '^B' backward-char
bindkey '^I' complete-word
bindkey '^U' kill-buffer

# Never run commands, except `cd`
setopt debug_before_cmd
DEBUGTRAP() {
    [[ $ZSH_DEBUG_CMD == 'cd '* ]] || setopt err_exit
}

# Send a line with null-byte at the end before and after completions are output
null-line () {
    echo -E - $'\0'
}
reset-compfuncs () {
    compprefuncs=( null-line )
    comppostfuncs=( null-line reset-compfuncs )
}
reset-compfuncs

zstyle ':completion:*' list-grouped false
zstyle ':completion:*' force-list always
zstyle ':completion:*' insert-tab false
zstyle ':completion:*' list-separator ''
zstyle ':completion:*' list-prompt   ''
zstyle ':completion:*' select-prompt ''
zstyle ':completion:*' menu true

zmodload zsh/zutil

compadd () {
    if [[ ${@[1,(i)(-|--)]} == *-(O|A|D)\ * ]]; then
        builtin compadd "$@"
        return $?
    fi

    typeset -a __hits __dscr __tmp

    if (( $@[(I)-d] )); then
        __tmp=${@[$[${@[(i)-d]}+1]]}
        if [[ $__tmp == \(* ]]; then
            eval "__dscr=$__tmp"
        else
            __dscr=( "${(@P)__tmp}" )
        fi
    fi

    builtin compadd -A __hits -D __dscr "$@"

    setopt localoptions norcexpandparam extendedglob

    typeset -A apre hpre hsuf asuf
    zparseopts -E P:=apre p:=hpre S:=asuf s:=hsuf

    integer dirsuf=0
    if [[ -z $hsuf && "${${@//-default-/}% -# *}" == *-[[:alnum:]]#f* ]]; then
        dirsuf=1
    fi

    [[ -n $__hits ]] || return

    local dsuf dscr
    for i in {1..$#__hits}; do
        (( dirsuf )) && [[ -d $__hits[$i] ]] && dsuf=/ || dsuf=
        (( $#__dscr >= $i )) && dscr=$'\t'"${${__dscr[$i]}##$__hits[$i] #}" || dscr=

        echo -E - $IPREFIX$apre$hpre$__hits[$i]$dsuf$hsuf$asuf$dscr
    done
}
