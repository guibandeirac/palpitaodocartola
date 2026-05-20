$cases = @(
  @{ci="50bd39b9-4cb5-45eb-8330-34e578e8dd9e"; r=1;  id=49167199; side="jogador2"; nome="Abdallah Junior"},
  @{ci="962c09c8-5fa5-4237-9f92-981a46a3d56c"; r=1;  id=29923004; side="jogador2"; nome="Lucas Sales"},
  @{ci="b7eb57ab-6026-4bb3-864d-a7815732d9e6"; r=1;  id=1172125;  side="jogador1"; nome="Rubem Gonzaga"},
  @{ci="16b20c45-f9af-4b2c-bdd2-b8f486a089dc"; r=2;  id=13951152; side="jogador1"; nome="Guilherme Santana"},
  @{ci="e3ef6f5d-7388-4aa8-8c0f-79e54bbea7c4"; r=2;  id=18433190; side="jogador2"; nome="Henrique Bispo"},
  @{ci="e500e831-c3ec-48fe-bdce-7ce826472fe4"; r=2;  id=20610991; side="jogador1"; nome="Lucas Ballan"},
  @{ci="4c5bd1ed-6073-48aa-90d9-df47d9c42733"; r=3;  id=51002752; side="jogador1"; nome="Nattan Solived"},
  @{ci="65865f54-49ce-4fd7-9169-c054593193ff"; r=3;  id=822810;   side="jogador2"; nome="Gustavo Duarte"},
  @{ci="9a4f38ba-4b4f-4d1d-b681-82a408d9cfbe"; r=3;  id=3366012;  side="jogador1"; nome="Rodrigo Ertal"},
  @{ci="18af0fbc-80ba-4ee1-99e6-588cda24b51b"; r=4;  id=10820940; side="jogador2"; nome="Felipe Bastos"},
  @{ci="1c5c7df0-efb5-446b-bf90-67f5ef79033e"; r=4;  id=4610109;  side="jogador1"; nome="Josué"},
  @{ci="89daf6fa-a6ea-4c78-9202-b0bb3fde2e11"; r=4;  id=4980868;  side="jogador1"; nome="Gian Carlos"},
  @{ci="2a61f905-8e32-4fc3-928a-941a34b3194d"; r=5;  id=822810;   side="jogador2"; nome="Gustavo Duarte"},
  @{ci="424ee0f0-2efe-4a56-b98d-e79870dfcfc4"; r=5;  id=47889235; side="jogador1"; nome="Varela"},
  @{ci="0b8192e8-e262-4705-9ce4-ff04b96cd095"; r=6;  id=3965687;  side="jogador1"; nome="Sóstenes"},
  @{ci="5eab58b9-2604-4148-8562-3d253cf484c2"; r=6;  id=51002752; side="jogador1"; nome="Nattan Solived"},
  @{ci="63dad77d-a76e-4a34-aa35-8a2e648f0d51"; r=6;  id=13951152; side="jogador2"; nome="Guilherme Santana"},
  @{ci="09d93f8f-2e68-45f7-b0f7-5c6a6774ca58"; r=7;  id=29923004; side="jogador2"; nome="Lucas Sales"},
  @{ci="0eb75f02-a30f-48ab-b64a-7b918dd284ea"; r=7;  id=3366012;  side="jogador2"; nome="Rodrigo Ertal"},
  @{ci="3df1ed06-6383-4fdb-8c25-142c89d45f73"; r=7;  id=18433190; side="jogador1"; nome="Henrique Bispo"},
  @{ci="96678848-7e57-4acd-897d-5afbec94aed7"; r=7;  id=13951152; side="jogador1"; nome="Guilherme Santana"},
  @{ci="1a17d757-653f-4c10-8f84-d61935375df9"; r=8;  id=29923004; side="jogador1"; nome="Lucas Sales"},
  @{ci="59001b71-aa59-48c6-8697-8c2680a50951"; r=8;  id=4223633;  side="jogador2"; nome="Gustavo B."},
  @{ci="b337204d-46f9-4d98-8a96-6330b08d1b0b"; r=8;  id=4980868;  side="jogador1"; nome="Gian Carlos"},
  @{ci="633922ad-cfa9-4629-af42-df56c1126a51"; r=9;  id=25518070; side="jogador2"; nome="Matheus Rocha"},
  @{ci="736f5025-a1c1-4d12-9a2f-2736cadd5d02"; r=9;  id=18919707; side="jogador1"; nome="Edeson Jr."},
  @{ci="b90ed3ca-afaa-4fb7-863e-a33cd471779c"; r=9;  id=4223633;  side="jogador1"; nome="Gustavo B."},
  @{ci="651340ae-a6b5-482e-908e-f74bed7b165e"; r=10; id=25493002; side="jogador2"; nome="Vinícius Cauã"},
  @{ci="7fd8606a-5902-4095-9192-712f25adf06a"; r=10; id=50292975; side="jogador1"; nome="Henrique Barros"},
  @{ci="57b9420b-0765-45b6-b42b-db67ae041736"; r=11; id=9864123;  side="jogador2"; nome="Moisés"},
  @{ci="6ea2fcc9-cfc4-479a-80fd-97344fa0528e"; r=11; id=16494835; side="jogador1"; nome="Ricardo Paccanaro"},
  @{ci="fb89a752-a91d-4a8e-aae4-a3dcfcf75bbe"; r=11; id=44509920; side="jogador2"; nome="Rafael Matos"},
  @{ci="473fd794-b7ca-4102-8201-80f4e3603559"; r=12; id=49167199; side="jogador2"; nome="Abdallah Junior"},
  @{ci="b2c564d4-7ed0-41db-b0da-f56ac9169a88"; r=13; id=4980868;  side="jogador2"; nome="Gian Carlos"},
  @{ci="d27ba29f-ef1e-4283-a2d1-558e6329ea19"; r=13; id=1754178;  side="jogador1"; nome="Willian"},
  @{ci="2c2bb5fc-3ab6-48d9-9cf8-f43ea6227d28"; r=14; id=44794091; side="jogador2"; nome="Magno Benjamim"},
  @{ci="3ed36093-288a-4b76-a03b-468aefddf288"; r=14; id=4610109;  side="jogador1"; nome="Josué"},
  @{ci="4f1c1e82-2457-4a7e-b645-1948fc43490b"; r=14; id=51002752; side="jogador2"; nome="Nattan Solived"},
  @{ci="53df6e8a-6945-4c8d-826e-5c2bcb80984a"; r=14; id=16494835; side="jogador1"; nome="Ricardo Paccanaro"},
  @{ci="686c2e98-2486-430b-9532-beee6a6d1a5e"; r=15; id=10051539; side="jogador1"; nome="Netinho"},
  @{ci="9ee0df16-b8b5-4314-a2da-6e57e56cb6ce"; r=15; id=47889235; side="jogador1"; nome="Varela"},
  @{ci="d328bbcf-f5a5-49f9-b5b8-6c20c69ca3c1"; r=15; id=4610109;  side="jogador2"; nome="Josué"},
  @{ci="62f19f69-d49f-4973-89b6-8a6ccda2628f"; r=16; id=89922;    side="jogador2"; nome="Carlos"},
  @{ci="7963d09c-ba13-40e4-8f61-8d8bd89ef79b"; r=16; id=18433190; side="jogador1"; nome="Henrique Bispo"}
)

function Get-TeamSnapshot($id, $r){
  try {
    $resp = Invoke-RestMethod -Uri ("https://api.cartola.globo.com/time/id/$id/$r") -UseBasicParsing
    $atletas = $resp.atletas
    $count = if($atletas){ $atletas.Count } else { 0 }
    $ids = if($count -gt 0){ (($atletas | ForEach-Object { $_.atleta_id } | Sort-Object) -join ",") } else { "" }
    $cap = if($resp.capitao_id){ $resp.capitao_id } else { "" }
    return @{count=$count; ids=$ids; cap=$cap; pontos=$resp.pontos}
  } catch {
    return @{count=-1; ids=""; cap=""; pontos=0; error=$_.ToString()}
  }
}

$results = @()
$i = 0
foreach($c in $cases){
  $i++
  Write-Output ("[$i/$($cases.Count)] $($c.nome) r$($c.r)...")
  $curr = Get-TeamSnapshot $c.id $c.r
  Start-Sleep -Milliseconds 250
  $escalou = $null
  $reason = ""
  if($curr.count -eq 0){
    $escalou = $false
    $reason = "no atletas in r$($c.r)"
  } elseif($c.r -eq 1){
    $escalou = $true
    $reason = "r1 with atletas=$($curr.count)"
  } else {
    $prev = Get-TeamSnapshot $c.id ($c.r - 1)
    Start-Sleep -Milliseconds 250
    if($prev.count -gt 0 -and $curr.ids -eq $prev.ids -and "$($curr.cap)" -eq "$($prev.cap)"){
      $escalou = $false
      $reason = "same team as r$($c.r - 1)"
    } else {
      $escalou = $true
      $reason = "team differs from r$($c.r - 1)"
    }
  }
  $results += [PSCustomObject]@{
    ci_id = $c.ci
    side = $c.side
    rodada = $c.r
    id_cartola = $c.id
    nome = $c.nome
    escalou = $escalou
    reason = $reason
  }
  Write-Output ("  => escalou=$escalou ($reason)")
}

$results | ConvertTo-Json -Depth 3 | Set-Content -Encoding utf8 "scripts/escalou-results.json"
Write-Output "DONE. Saved to scripts/escalou-results.json"
Write-Output "==============================="
Write-Output "Não escalaram (false):"
$results | Where-Object { $_.escalou -eq $false } | ForEach-Object { Write-Output ("  $($_.nome) r$($_.rodada) ci=$($_.ci_id) side=$($_.side)") }
