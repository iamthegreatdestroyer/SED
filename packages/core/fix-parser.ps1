$file = 's:\SED\packages\core\src\semantic\parser.ts'
$content = Get-Content $file -Raw

# Fix 1: Add missing properties to DEFAULT_OPTIONS (Line 22)
$old1 = @"
const DEFAULT_OPTIONS: Required<ParserOptions> = {
  includeComments: false,
  maxDepth: 50,
  timeout: 5000,
};
"@

$new1 = @"
const DEFAULT_OPTIONS: Required<ParserOptions> = {
  includeComments: false,
  maxDepth: 50,
  timeout: 5000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  customPatterns: [],
};
"@

if ($content.Contains($old1)) {
    $content = $content -replace [regex]::Escape($old1), $new1
    Write-Host "✓ Fixed DEFAULT_OPTIONS"
}
else {
    Write-Host "✗ DEFAULT_OPTIONS pattern not found"
}

Set-Content $file -Value $content
