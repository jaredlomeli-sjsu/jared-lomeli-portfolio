<#
  xlsx-to-pdf.ps1 — convert an Excel workbook to PDF for embedding (e.g. a lab's
  data spreadsheet, appended after the report PDF).

  Uses Microsoft Excel via COM (Excel must be installed). Each worksheet is set
  to fit-to-one-page-wide and landscape so wide data tables aren't clipped.

  Usage (from the repo root):
    powershell -File scripts/xlsx-to-pdf.ps1 -Path "C:\path\data.xlsx" -OutDir "public/documents/phys-2a"
    powershell -File scripts/xlsx-to-pdf.ps1 -Path "C:\path\data.xlsx" -Out "C:\tmp\out.pdf"
#>
param(
  [Parameter(Mandatory = $true)] [string] $Path,
  [string] $OutDir,
  [string] $Out
)

$ErrorActionPreference = "Stop"
$xlTypePDF = 0
$xlLandscape = 2

$src = (Resolve-Path -LiteralPath $Path).Path
if ($Out) {
  $pdf = $Out
} else {
  $dir = if ($OutDir) { (Resolve-Path $OutDir).Path } else { Split-Path $src -Parent }
  $pdf = Join-Path $dir ([System.IO.Path]::GetFileNameWithoutExtension($src) + ".pdf")
}
$pdf = [string]$pdf

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false

try {
  $wb = $xl.Workbooks.Open($src, $false, $true)  # UpdateLinks=0, ReadOnly=$true
  foreach ($ws in $wb.Worksheets) {
    $ws.PageSetup.Orientation = $xlLandscape
    $ws.PageSetup.Zoom = $false
    $ws.PageSetup.FitToPagesWide = 1
    $ws.PageSetup.FitToPagesTall = $false
  }
  $wb.ExportAsFixedFormat($xlTypePDF, $pdf)
  $wb.Close($false)
  if (Test-Path $pdf) {
    Write-Host ("wrote  {0}  ({1:N0} bytes)" -f $pdf, (Get-Item $pdf).Length)
  } else {
    throw "no output produced"
  }
}
finally {
  $xl.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}
