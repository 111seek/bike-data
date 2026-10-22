#!/bin/sh
# 安装 git 钩子：每次在 main 分支提交后自动 push 到 origin。
# 用法：sh scripts/install-hooks.sh
set -e

root=$(git rev-parse --show-toplevel)
hook="$root/.git/hooks/post-commit"

cat > "$hook" <<'HOOK'
#!/bin/sh
# 自动推送：main 分支每次提交后推送到 origin（后台执行，不阻塞 commit）。
branch=$(git symbolic-ref --short HEAD 2>/dev/null) || exit 0
[ "$branch" = "main" ] || exit 0

git remote get-url origin >/dev/null 2>&1 || exit 0

# rebase / merge / cherry-pick 过程中不要推送中间状态
case "${GIT_REFLOG_ACTION:-}" in
  *rebase*|*merge*|*cherry-pick*|*am*) exit 0 ;;
esac

root=$(git rev-parse --show-toplevel)
GIT_SSH_COMMAND="ssh -o ConnectTimeout=10 -o BatchMode=yes" \
  nohup git push origin "$branch" >"$root/.git/auto-push.log" 2>&1 &
exit 0
HOOK

chmod +x "$hook"
echo "installed: $hook"
