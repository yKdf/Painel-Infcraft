<!DOCTYPE html>
<html>
<head>
    <title>Authenticating...</title>
</head>
<body>
    <script>
        try {
            if (window.opener) {
                window.opener.location.href = '{{ $redirect }}';
                window.close();
            } else {
                window.location.href = '{{ $redirect }}';
            }
        } catch (e) {
            window.location.href = '{{ $redirect }}';
        }
    </script>
</body>
</html>
