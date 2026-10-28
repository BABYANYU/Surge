$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Read-CodexCredentials {
    $candidates = @()
    if ($env:CODEX_HOME) { $candidates += Join-Path $env:CODEX_HOME 'auth.json' }
    $candidates += Join-Path $env:USERPROFILE '.codex\auth.json'
    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (-not (Test-Path -LiteralPath $candidate)) { continue }
        try {
            $auth = [IO.File]::ReadAllText($candidate, [Text.Encoding]::UTF8) | ConvertFrom-Json
            if ($auth.auth_mode -eq 'chatgpt' -and $auth.tokens.access_token -and $auth.tokens.account_id) {
                return $auth.tokens
            }
        } catch { }
    }
    throw '未找到可用凭据。请先在电脑 Codex 中使用 ChatGPT 账号登录。'
}

[System.Windows.Forms.Application]::EnableVisualStyles()
$form = New-Object Windows.Forms.Form
$form.Text = 'Codex 参数复制'
$form.ClientSize = New-Object Drawing.Size 480,252
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.Font = New-Object Drawing.Font 'Microsoft YaHei UI',10
$form.BackColor = [Drawing.Color]::White

$heading = New-Object Windows.Forms.Label
$heading.Text = '复制到 Surge 模块参数'
$heading.Location = New-Object Drawing.Point 24,22
$heading.Size = New-Object Drawing.Size 430,30
$heading.Font = New-Object Drawing.Font 'Microsoft YaHei UI',14,([Drawing.FontStyle]::Bold)
$form.Controls.Add($heading)

$note = New-Object Windows.Forms.Label
$note.Text = "读取本机 Codex 当前登录凭据，不联网、不保存副本。`n凭据不在窗口中显示，请勿粘贴到聊天或公开配置。"
$note.Location = New-Object Drawing.Point 24,66
$note.Size = New-Object Drawing.Size 430,55
$form.Controls.Add($note)

$status = New-Object Windows.Forms.Label
$status.Text = '选择需要复制的参数。'
$status.Location = New-Object Drawing.Point 24,190
$status.Size = New-Object Drawing.Size 430,45
$status.ForeColor = [Drawing.Color]::DimGray
$form.Controls.Add($status)

$copyToken = New-Object Windows.Forms.Button
$copyToken.Text = '复制 AccessToken'
$copyToken.Location = New-Object Drawing.Point 24,132
$copyToken.Size = New-Object Drawing.Size 205,42
$copyToken.Add_Click({
    try {
        $credentials = Read-CodexCredentials
        [Windows.Forms.Clipboard]::SetText([string]$credentials.access_token)
        $status.Text = 'Token 已复制。请粘贴到 Surge 的 AccessToken 参数。'
        $credentials = $null
    } catch { $status.Text = '读取或复制失败，请确认 Codex 已登录、剪贴板可用。' }
})
$form.Controls.Add($copyToken)

$copyId = New-Object Windows.Forms.Button
$copyId.Text = '复制 AccountId'
$copyId.Location = New-Object Drawing.Point 251,132
$copyId.Size = New-Object Drawing.Size 205,42
$copyId.Add_Click({
    try {
        $credentials = Read-CodexCredentials
        [Windows.Forms.Clipboard]::SetText([string]$credentials.account_id)
        $status.Text = '账户 ID 已复制。请粘贴到 Surge 的 AccountId 参数。'
        $credentials = $null
    } catch { $status.Text = '读取或复制失败，请确认 Codex 已登录、剪贴板可用。' }
})
$form.Controls.Add($copyId)
[void]$form.ShowDialog()
$form.Dispose()
