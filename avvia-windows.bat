@echo off
chcp 65001 >nul
echo ================================================
echo    MAREA - invio del codice su GitHub (Windows)
echo ================================================
echo.
echo PRIMA: hai gia' creato il repository "marea" su github.com ?
echo (In alto a destra: +  -^>  New repository  -^>  nome: marea  -^>  Create repository)
echo.
set /p ok="Scrivi SI e premi Invio: "
if /i not "%ok%"=="SI" (
  echo Va bene: prima crea il repository su GitHub, poi rilancia questo file.
  pause
  exit /b 1
)
set /p USER="Qual e' il TUO username di GitHub (senza @)? "
if "%USER%"=="" (
  echo Manca il username.
  pause
  exit /b 1
)
cd /d "%~dp0"
echo.
echo Parto...
echo.
git init -q
git add -A
git commit -qm "marea"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/%USER%/marea.git
git push -u origin main
if %errorlevel% equ 0 (
  echo.
  echo ==================================================
  echo   FATTO! Il codice e' su GitHub.
  echo.
  echo   PASSO DOPO: vai su vercel.com -^>
  echo   Add New -^> Project -^> importa "marea".
  echo ==================================================
) else (
  echo.
  echo Il push non e' passato al primo colpo. E' normale la prima volta:
  echo GitHub probabilmente ti ha chiesto una conferma NEL BROWSER.
  echo Apri quella pagina, conferma, e poi ri-incolla qui:
  echo     git push -u origin main
  echo.
  echo Se vedi un errore, incollalo nella chat Marea cosi' te lo risolviamo.
)
echo.
pause
