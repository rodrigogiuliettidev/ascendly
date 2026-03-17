@echo off
cd /d "c:\Users\rodri\Documents\Pessoal\projetospessoais\ascendly"

if exist "create-dirs.js" (
    for /f %%i in ('where node') do (
        echo Found Node.js at: %%i
        call node create-dirs.js
        goto :done
    )
)

:done
echo Done!
