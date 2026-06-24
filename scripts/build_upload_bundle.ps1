$workspace = 'C:\Users\z\Documents\微信小程序制作'
$bundleDir = Join-Path $workspace 'upload_bundle'
$zipPath = Join-Path $workspace 'zrc-github-upload.zip'

if (Test-Path $bundleDir) {
  Remove-Item $bundleDir -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $bundleDir | Out-Null

$include = @(
  '.github',
  '.gitignore',
  'README.md',
  'app.js',
  'app.json',
  'app.miniapp.json',
  'app.wxss',
  'assets',
  'cloudfunctions',
  'config',
  'data',
  'docs',
  'i18n',
  'package.json',
  'pages',
  'project.config.json',
  'project.miniapp.json',
  'project.private.config.json',
  'scripts',
  'services',
  'sitemap.json',
  'utils',
  'web'
)

foreach ($item in $include) {
  $source = Join-Path $workspace $item
  $target = Join-Path $bundleDir $item
  if (Test-Path $source) {
    Copy-Item $source $target -Recurse -Force
  }
}

$archiveSource = Join-Path $bundleDir '*'
Compress-Archive -Path $archiveSource -DestinationPath $zipPath -Force
Write-Output $zipPath
