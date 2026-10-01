<#
  docx-to-pdf.ps1 — convert Word documents to PDF for embedding on coursework
  cards (the in-page PDF viewer / links.pdfReport needs a real PDF; a .docx in
  an <iframe> just downloads).

  Uses Microsoft Word via COM automation (Word must be installed). No pandoc or
  LibreOffice required.

  Usage (from the repo root):
    powershell -File scripts/docx-to-pdf.ps1 -Path "public/documents/bus3-12"
    powershell -File scripts/docx-to-pdf.ps1 -Path "public/documents/bus3-12/four-year-academic-plan.docx"
    powershell -File scripts/docx-to-pdf.ps1 -Path "C:\some\file.docx" -OutDir "public/documents/bus3-12"

  A .docx whose .pdf already exists is skipped unless -Force is given.
#>
param(
  [Parameter(Mandatory = $true)] [string] $Path,
  [string] $OutDir,
  [switch] $Force
)

$ErrorActionPreference = "Stop"
$wdFormatPDF = 17

$item = Get-Item -LiteralPath $Path
if ($item.PSIsContainer) {
  $docs = Get-ChildItem -LiteralPath $Path -Filter *.docx -File |
          Where-Object { $_.Name -notlike '~$*' }
} else {
  $docs = @($item)
}

if (-not $docs) { Write-Host "No .docx files found at $Path"; exit 0 }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  foreach ($doc in $docs) {
    $targetDir = if ($OutDir) { [string](Resolve-Path $OutDir).Path } else { [string]$doc.DirectoryName }
    $pdf = [string](Join-Path $targetDir ($doc.BaseName + ".pdf"))

    if ((Test-Path $pdf) -and -not $Force) {
      Write-Host "skip (exists)  $pdf"
      continue
    }

    $opened = $word.Documents.Open($doc.FullName, $false, $true)  # ConfirmConversions=$false, ReadOnly=$true
    $opened.SaveAs([ref]$pdf, [ref]$wdFormatPDF)
    $opened.Close($false)
    Write-Host ("wrote  {0}  ({1:N0} bytes)" -f $pdf, (Get-Item $pdf).Length)
  }
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
