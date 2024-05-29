Push-Location
Set-Location (Split-Path $MyInvocation.MyCommand.Path)

Set-Location client
npm run lint:fix
if ($?){
    npm run build   
    if ($?){
        npm run test -- --browsers ChromeHeadless --no-watch
    }
}
Set-Location ..

Set-Location server
npm run lint:fix
if ($?){
    npm run build   
    if ($?){
        npm run test
    }
}
Set-Location ..

Pop-Location