param([Parameter(Mandatory=$true)][string]$OutPath)
$ErrorActionPreference='Stop'
# Ephemeral local QA certificate only. Does not install anything in a certificate/trust store.
$key=[System.Security.Cryptography.RSACryptoServiceProvider]::new(2048)
$key.PersistKeyInCsp=$false
$request=[System.Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=localhost',$key,[System.Security.Cryptography.HashAlgorithmName]::SHA256,[System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$san=[System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new(); $san.AddDnsName('localhost'); $san.AddIpAddress([System.Net.IPAddress]::Parse('127.0.0.1')); $request.CertificateExtensions.Add($san.Build())
$certificate=$request.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-1),[DateTimeOffset]::UtcNow.AddHours(1))
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($OutPath)) | Out-Null
[System.IO.File]::WriteAllBytes($OutPath,$certificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx,'local-qa-only'))
$certificate.Dispose(); $key.Dispose()
