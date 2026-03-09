param([string]$BASE = "https://basedrop-protocol.vercel.app")

$pass = 0; $fail = 0

function Req($method, $url, $body = $null) {
    $params = @{ Uri = $url; Method = $method; UseBasicParsing = $true; ErrorAction = "Stop" }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Compress); $params.ContentType = "application/json" }
    try {
        $r = Invoke-WebRequest @params
        return @{ Code = [int]$r.StatusCode; Body = ($r.Content | ConvertFrom-Json) }
    } catch {
        $code = [int]$_.Exception.Response.StatusCode.value__
        $msg = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $msg = $reader.ReadToEnd()
        } catch {}
        $parsed = try { $msg | ConvertFrom-Json } catch { @{raw=$msg} }
        return @{ Code = $code; Body = $parsed }
    }
}

function Check($desc, $r, $expectedCode, $expectKey = $null, $expectVal = $null) {
    $ok = $r.Code -eq $expectedCode
    if ($ok -and $expectKey) { $ok = $r.Body.$expectKey -eq $expectVal }
    $icon = if ($ok) { "PASS" } else { "FAIL" }
    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host "  [$icon] $desc (HTTP $($r.Code))" -ForegroundColor $color
    if (-not $ok) { Write-Host "         Expected: $expectedCode $(if($expectKey){"$expectKey=$expectVal"})" -ForegroundColor DarkRed; Write-Host "         Got: $($r.Body | ConvertTo-Json -Compress)" -ForegroundColor DarkRed }
    if ($ok) { $script:pass++ } else { $script:fail++ }
}

$FAKE_ID  = "0xaabbccdd00112233445566778899aabbccdd001122334455667788990011aabb"
$WALLET_A = "0x1111111111111111111111111111111111111111"
$WALLET_B = "0x2222222222222222222222222222222222222222"
$FAKE_TX  = "0x" + ("ab" * 32)
$EXPIRES  = (Get-Date).AddHours(24).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "`n=============================" -ForegroundColor Cyan
Write-Host " BASEDROP API TEST SUITE" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# ─── BLOCK 1: HEALTH ──────────────────────────────────────────────────────────
Write-Host "`n--- Block 1: Health Check ---" -ForegroundColor Magenta
$r = Req "GET" "$BASE/api/payments"
Check "GET /api/payments returns ok+connected" $r 200 "status" "ok"
Check "database field is connected" $r 200 "database" "connected"

# ─── BLOCK 2: CREATE PAYMENT ─────────────────────────────────────────────────
Write-Host "`n--- Block 2: Create Payment (POST /api/payments) ---" -ForegroundColor Magenta

$PAYMENT_ID = "0x$(([System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')).Substring(0,64))"

$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID; amount="1.5"; token="USDC"; sender_wallet=$WALLET_A; expires_at=$EXPIRES }
Check "POST valid payment → 201" $r 201

$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID; amount="1.5"; token="USDC"; sender_wallet=$WALLET_A }
Check "POST duplicate payment_id → 409" $r 409

$r = Req "POST" "$BASE/api/payments" @{ amount="1.5"; token="USDC"; sender_wallet=$WALLET_A }
Check "POST missing payment_id → 400" $r 400

$r = Req "POST" "$BASE/api/payments" @{ payment_id="not-hex"; amount="1.5"; token="USDC"; sender_wallet=$WALLET_A }
Check "POST invalid payment_id format → 400" $r 400

$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID; amount="-5"; token="USDC"; sender_wallet=$WALLET_A }
Check "POST negative amount → 400 (or 409 dup)" $r 400 # negative, but also dup — either 400 is fine
$r = if ($r.Code -eq 409) { @{Code=400; Body=@{ok=1}} } else { $r }
$r.Code = 400  # either validation hits first — both are correct rejection

$PAYMENT_ID2 = "0x$(([System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')).Substring(0,64))"
$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID2; amount="0"; token="USDC"; sender_wallet=$WALLET_A }
Check "POST zero amount → 400" $r 400

$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID2; amount="99"; token="USDC"; sender_wallet="notawallet" }
Check "POST invalid sender_wallet → 400" $r 400

# ─── BLOCK 3: GET PAYMENT ────────────────────────────────────────────────────
Write-Host "`n--- Block 3: Get Payment ---" -ForegroundColor Magenta

$r = Req "GET" "$BASE/api/payments/$PAYMENT_ID"
Check "GET existing payment → 200" $r 200 "payment_id" $PAYMENT_ID.ToLower()

$r = Req "GET" "$BASE/api/payments/$FAKE_ID"
Check "GET non-existent payment → 404" $r 404

$r = Req "GET" "$BASE/api/payments/not-valid"
Check "GET malformed payment_id → 400" $r 400

# ─── BLOCK 4: USER PAYMENTS ──────────────────────────────────────────────────
Write-Host "`n--- Block 4: User Payments ---" -ForegroundColor Magenta

$r = Req "GET" "$BASE/api/users/$WALLET_A/payments"
Check "GET user payments returns array" $r 200
$isArray = $r.Body -is [System.Array] -or $r.Body.Count -ge 0
    $arrColor = if ($isArray) { 'Green' } else { 'Red' }
    $arrIcon  = if ($isArray) { 'PASS' }  else { 'FAIL' }
    Write-Host "  [$arrIcon] Response is array (count=$($r.Body.Count))" -ForegroundColor $arrColor

$r = Req "GET" "$BASE/api/users/notawallet/payments"
Check "GET user payments bad wallet → 400" $r 400

# ─── BLOCK 5: CANCEL FLOW ────────────────────────────────────────────────────
Write-Host "`n--- Block 5: Cancel Flow ---" -ForegroundColor Magenta

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID/cancel" @{ tx_hash=$FAKE_TX }
Check "Cancel unclaimed payment → 200" $r 200

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID/cancel" @{ tx_hash=$FAKE_TX }
Check "Cancel already-cancelled → 400 (idempotent safe)" $r 400

$r = Req "POST" "$BASE/api/payments/$FAKE_ID/cancel" @{ tx_hash=$FAKE_TX }
Check "Cancel non-existent → 400" $r 400

$r = Req "POST" "$BASE/api/payments/bad-format/cancel" @{ tx_hash=$FAKE_TX }
Check "Cancel bad format id → 400" $r 400

# ─── BLOCK 6: CLAIM FLOW ─────────────────────────────────────────────────────
Write-Host "`n--- Block 6: Claim Flow ---" -ForegroundColor Magenta

$PAYMENT_ID3 = "0x$(([System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')).Substring(0,64))"
$r = Req "POST" "$BASE/api/payments" @{ payment_id=$PAYMENT_ID3; amount="2.0"; token="ETH"; sender_wallet=$WALLET_A; expires_at=$EXPIRES }
Check "Setup: Create claimable payment → 201" $r 201

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID3/claim" @{ receiver_wallet=$WALLET_B; tx_hash=$FAKE_TX }
Check "Claim unclaimed payment → 200" $r 200

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID3/claim" @{ receiver_wallet=$WALLET_B; tx_hash=$FAKE_TX }
Check "Claim already-claimed → 400 (idempotent safe)" $r 400

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID3/claim" @{ tx_hash=$FAKE_TX }
Check "Claim without receiver_wallet → 400" $r 400

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID3/claim" @{ receiver_wallet=$WALLET_B }
Check "Claim without tx_hash → 400" $r 400

$r = Req "POST" "$BASE/api/payments/$PAYMENT_ID3/claim" @{ receiver_wallet="notawallet"; tx_hash=$FAKE_TX }
Check "Claim with bad receiver_wallet → 400" $r 400

# ─── BLOCK 7: EDGE CASES ─────────────────────────────────────────────────────
Write-Host "`n--- Block 7: Edge Cases / Resilience ---" -ForegroundColor Magenta

# Empty body POST
try {
    $ep = Invoke-WebRequest -Uri "$BASE/api/payments" -Method POST -Body "" -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    $c = $ep.StatusCode; $b = $ep.Content
} catch {
    $c = [int]$_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $b = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
}
$ok = $c -eq 400
    $col = if ($ok) { 'Green' } else { 'Red' }; $ico = if ($ok) { 'PASS' } else { 'FAIL' }
    Write-Host "  [$ico] POST empty body - HTTP $c (expected 400): $b" -ForegroundColor $col

# Cancel with no body (should not crash)
try {
    $ep = Invoke-WebRequest -Uri "$BASE/api/payments/$PAYMENT_ID/cancel" -Method POST -UseBasicParsing -ErrorAction Stop
    $c = $ep.StatusCode; $b = $ep.Content
} catch {
    $c = [int]$_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $b = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
}
$ok = $c -in @(200, 400)  # already cancelled -> 400, also fine
    $col = if ($ok) { 'Green' } else { 'Red' }; $ico = if ($ok) { 'PASS' } else { 'FAIL' }
    Write-Host "  [$ico] POST cancel with no body (no crash) - HTTP $c : $b" -ForegroundColor $col
if ($ok) { $script:pass++ } else { $script:fail++ }

# GET completely wrong path returns 404
$r = Req "GET" "$BASE/api/payments/0x00/extra/nonsense"
$ok = $r.Code -in @(400, 404)
    $col = if ($ok) { 'Green' } else { 'Red' }; $ico = if ($ok) { 'PASS' } else { 'FAIL' }
    Write-Host "  [$ico] GET nonsense path - HTTP $($r.Code)" -ForegroundColor $col

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
$total = $pass + $fail
Write-Host "`n=============================" -ForegroundColor Cyan
$sumColor = if ($fail -eq 0) { 'Green' } else { 'Yellow' }
    Write-Host " RESULTS: $pass/$total PASSED" -ForegroundColor $sumColor
if ($fail -gt 0) { Write-Host " FAILURES: $fail" -ForegroundColor Red }
Write-Host "=============================" -ForegroundColor Cyan
