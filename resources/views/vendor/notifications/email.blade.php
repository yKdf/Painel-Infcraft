<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

    <style type="text/css" rel="stylesheet" media="all">
        /* Media Queries */
        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
    </style>
</head>

<?php

$style = [
    /* Layout ------------------------------ */

    'body' => 'margin: 0; padding: 0; width: 100%; background-color: #F2F4F6;',
    'email-wrapper' => 'width: 100%; margin: 0; padding: 0; background-color: #F2F4F6;',

    /* Masthead ----------------------- */

    'email-masthead' => 'padding: 25px 0; text-align: center; padding: 10px;',
    'email-masthead_name' => 'font-size: 16px; font-weight: bold; color: #2F3133; text-decoration: none; text-shadow: 0 1px 0 white; padding: 10px;',

    'email-body' => 'width: 100%; margin: 0; padding: 0; border-top: 1px solid #EDEFF2; border-bottom: 1px solid #EDEFF2; background-color: #FFF;',
    'email-body_inner' => 'width: auto; max-width: 570px; margin: 0 auto; padding: 0;',
    'email-body_cell' => 'padding: 35px;',

    'email-footer' => 'width: auto; max-width: 570px; margin: 0 auto; padding: 0; text-align: center;',
    'email-footer_cell' => 'color: #AEAEAE; padding: 35px; text-align: center;',

    /* Body ------------------------------ */

    'body_action' => 'width: 100%; margin: 30px auto; padding: 0; text-align: center;',
    'body_sub' => 'margin-top: 25px; padding-top: 25px; border-top: 1px solid #EDEFF2;',

    /* Type ------------------------------ */

    'anchor' => 'color: #3869D4;',
    'header-1' => 'margin-top: 0; color: #2F3133; font-size: 19px; font-weight: bold; text-align: left;',
    'paragraph' => 'margin-top: 0; color: #74787E; font-size: 16px; line-height: 1.5em;',
    'paragraph-sub' => 'margin-top: 0; color: #74787E; font-size: 12px; line-height: 1.5em;',
    'paragraph-center' => 'text-align: center;',

    /* Buttons ------------------------------ */

    'button' => 'display: block; display: inline-block; width: 200px; min-height: 20px; padding: 10px;
                 background-color: #3869D4; border-radius: 3px; color: #ffffff; font-size: 15px; line-height: 25px;
                 text-align: center; text-decoration: none; -webkit-text-size-adjust: none;',

    'button--green' => 'background-color: #22BC66;',
    'button--red' => 'background-color: #dc4d2f;',
    'button--blue' => 'background-color: #3869D4;',
];
?>

<?php $fontFamily = 'font-family: Arial, \'Helvetica Neue\', Helvetica, sans-serif;'; ?>

<body style="{{ $style['body'] }}">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="{{ $style['email-wrapper'] }}" align="center">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <!-- Logo -->
                    <tr>
                        <td style="{{ $style['email-masthead'] }}">
                            <a style="{{ $fontFamily }} {{ $style['email-masthead_name'] }}" href="{{ url('/') }}" target="_blank">
                                <svg viewBox="0 0 2048 627" width="320" height="128" xmlns="http://www.w3.org/2000/svg">
                                    <path transform="translate(229,124)" d="m0 0h259v263l-4 6-56 56h-2l-1 3-5 5h-2l-1 3-6 5-20 20h-263l-1-1v-264l9-10 84-84zm9 15-8 1-79 79v1l10 1h230v240l7-6 74-74v-242z" fill="#6118CB"/>
                                    <path transform="translate(1456,174)" d="m0 0h85l13 4 10 7 7 8 5 11 3 16v224l-17 1h-42l-1-1-1-36v-52h-38v77l-1 11-20 1h-38l-2-1v-227l4-16 6-11 8-8 14-7zm29 40-5 2v96h37l1-1v-93l-2-3-3-1z" fill="#111"/>
                                    <path transform="translate(1223,178)" d="m0 0h118l8 2 12 6 9 9 7 14 2 11v54l-2 9-7 13-7 6-5 3 9 7 6 8 2 5 2 12v87l-1 20-18 1h-40l-2-6-1-99-1-3-11-1h-20l-1 108-28 1h-30l-1-1zm59 40v77h33l3-2v-72l-1-2-4-1z" fill="#111"/>
                                    <path transform="translate(707,174)" d="m0 0h82l10 3 11 6 7 7 6 12 3 11 1 10v220l-1 1-19 1h-39l-2-7-1-219-1-3-4-1h-28l-1 229-28 1h-31l-2-1v-224l4-18 6-11 5-6 11-7z" fill="#111"/>
                                    <path transform="translate(1065,174)" d="m0 0h82l13 4 9 6 7 7 6 12 2 7 1 11v33l-31 1h-21l-5-1-2-39h-36v188l1 4h35l2-48h57v42l-2 15-5 12-6 8-7 6-12 5-4 1-14 1h-62l-14-2-12-6-9-9-7-14-2-10v-195l4-13 5-9 5-6 10-7 7-3z" fill="#111"/>
                                    <path transform="translate(868,178)" d="m0 0h123v47l-1 1h-61v65h57l1 1v46l-1 1h-57v104l-1 1-24 1h-34l-2-1z" fill="#111"/>
                                    <path transform="translate(1625,178)" d="m0 0h123v47l-1 1h-61v65h57l1 1v37l-1 10h-57v104l-1 1-27 1h-32l-1-1z" fill="#111"/>
                                    <path transform="translate(1769,178)" d="m0 0h146l1 1v19l-1 28h-43v218l-32 1h-27l-1-1-1-36v-72l1-110h-43z" fill="#111"/>
                                    <path transform="translate(565,178)" d="m0 0h60v266l-34 1h-24l-3-2v-264z" fill="#111"/>
                                    </svg>

                            </a>
                        </td>
                    </tr>

                    <!-- Email Body -->
                    <tr>
                        <td style="{{ $style['email-body'] }}" width="100%">
                            <table style="{{ $style['email-body_inner'] }}" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="{{ $fontFamily }} {{ $style['email-body_cell'] }}">
                                        <!-- Greeting -->
                                        <h1 style="{{ $style['header-1'] }}">
                                            @if (! empty($greeting))
                                                {{ $greeting }}
                                            @else
                                                @if ($level == 'error')
                                                    Whoops!
                                                @else
                                                    Hello!
                                                @endif
                                            @endif
                                        </h1>

                                        <!-- Intro -->
                                        @foreach ($introLines as $line)
                                            <p style="{{ $style['paragraph'] }}">
                                                {{ $line }}
                                            </p>
                                        @endforeach

                                        <!-- Action Button -->
                                        @if (isset($actionText))
                                            <table style="{{ $style['body_action'] }}" align="center" width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center">
                                                        <?php
                                                            switch ($level) {
                                                                case 'success':
                                                                    $actionColor = 'button--green';
                                                                    break;
                                                                case 'error':
                                                                    $actionColor = 'button--red';
                                                                    break;
                                                                default:
                                                                    $actionColor = 'button--blue';
                                                            }
                                                        ?>

                                                        <a href="{{ $actionUrl }}"
                                                            style="{{ $fontFamily }} {{ $style['button'] }} {{ $style[$actionColor] }}"
                                                            class="button"
                                                            target="_blank">
                                                            {{ $actionText }}
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif

                                        <!-- Outro -->
                                        @foreach ($outroLines as $line)
                                            <p style="{{ $style['paragraph'] }}">
                                                {{ $line }}
                                            </p>
                                        @endforeach

                                        <!-- Salutation -->
                                        <p style="{{ $style['paragraph'] }}">
                                            Cumprimentos,<br>{{ config('app.name') }}
                                        </p>

                                        <!-- Sub Copy -->
                                        @if (isset($actionText))
                                            <table style="{{ $style['body_sub'] }}">
                                                <tr>
                                                    <td style="{{ $fontFamily }}">
                                                        <p style="{{ $style['paragraph-sub'] }}">
                                                            Se você estiver tendo problemas para clicar no botão "{{ $actionText }}" copie e cole
                                                            o URL abaixo em seu navegador:
                                                        </p>

                                                        <p style="{{ $style['paragraph-sub'] }}">
                                                            <a style="{{ $style['anchor'] }}" href="{{ $actionUrl }}" target="_blank">
                                                                {{ $actionUrl }}
                                                            </a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td>
                            <table style="{{ $style['email-footer'] }}" align="center" width="570" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="{{ $fontFamily }} {{ $style['email-footer_cell'] }}">
                                        <p style="{{ $style['paragraph-sub'] }}">
                                            &copy; {{ date('Y') }}
                                            <a style="{{ $style['anchor'] }}" href="{{ url('/') }}" target="_blank">{{ config('app.name') }}</a>.
                                            Todos os direitos reservados.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
