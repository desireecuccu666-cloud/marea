#!/bin/bash
# MAREA — ti invia il codice su GitHub. Doppio clic su questo file.
clear
echo "=============================================="
echo "   MAREA — invio del codice su GitHub (Mac)"
echo "=============================================="
echo
echo "PRIMA: hai gia' creato il repository 'marea' su github.com ?"
echo "(In alto a destra: +  ->  New repository  ->  nome: marea  ->  Create repository)"
echo
read -p "Scrivi SI e premi Invio: " ok
if [ "$ok" != "SI" ] && [ "$ok" != "si" ] && [ "$ok" != "sì" ]; then
  echo "Va bene: prima crea il repository su GitHub, poi rilancia questo file."
  read -p "Premi Invio per uscire..." x
  exit 1
fi
echo
read -p "Qual e' il TUO username di GitHub (senza @)? " USER
if [ -z "$USER" ]; then
  echo "Manca il username."
  read -p "Premi Invio per uscire..." x
  exit 1
fi
cd "$(dirname "$0")" || exit 1
echo
echo "Parto..."
echo
git init -q 2>/dev/null
git add -A
git commit -qm "marea" 2>/dev/null
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$USER/marea.git"
git push -u origin main
if [ $? -eq 0 ]; then
  echo
  echo "=============================================="
  echo "  FATTO! Il codice e' su GitHub. 🎉"
  echo
  echo "  PASSO DOPO: vai su vercel.com ->"
  echo "  Add New -> Project -> importa 'marea'."
  echo "=============================================="
else
  echo
  echo "Il push non e' passato al primo colpo. E' normale la prima volta:"
  echo "GitHub probabilmente ti ha chiesto una conferma NEL BROWSER."
  echo "Apri quella pagina, conferma, e poi ri-incolla qui:"
  echo "    git push -u origin main"
  echo
  echo "Se vedi un errore, incollalo nella chat Marea cosi' te lo risolviamo."
fi
echo
read -p "Premi Invio per chiudere..." x
