@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'google-sso'])

@section('title')
    Google SSO Settings
@endsection

@section('content-header')
    <h1>Google SSO<small>Configure Google Single Sign-On for authentication and account linking.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    @php
        $googleEnabled = old('services:google:enabled', config('services.google.enabled') ? 'true' : 'false');
        $autoLink = old('services:google:auto_link_by_email', config('services.google.auto_link_by_email') ? 'true' : 'false');
        $autoCreate = old('services:google:auto_create_account', config('services.google.auto_create_account') ? 'true' : 'false');
    @endphp
    <div class="row">
        <div class="col-xs-12">
            <form action="" method="POST">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Google OAuth 2.0</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Status</label>
                                <div>
                                    <select class="form-control" name="services:google:enabled">
                                        <option value="true" @if($googleEnabled === 'true') selected @endif>Enabled</option>
                                        <option value="false" @if($googleEnabled === 'false') selected @endif>Disabled</option>
                                    </select>
                                    <p class="text-muted small">Enable Google Single Sign-On for login and account linking.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Client ID</label>
                                <div>
                                    <input type="text" class="form-control" name="services:google:client_id" value="{{ old('services:google:client_id', config('services.google.client_id')) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Client Secret</label>
                                <div>
                                    <input type="password" class="form-control" name="services:google:client_secret" value="{{ old('services:google:client_secret', config('services.google.client_secret')) }}">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-xs-12">
                                <p class="text-muted small no-margin">
                                    Callback URL: <code>{{ route('auth.google.callback') }}</code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Account Linking Behavior</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Auto Link Existing Accounts by Email</label>
                                <div>
                                    <select class="form-control" name="services:google:auto_link_by_email">
                                        <option value="true" @if($autoLink === 'true') selected @endif>Enabled</option>
                                        <option value="false" @if($autoLink === 'false') selected @endif>Disabled</option>
                                    </select>
                                    <p class="text-muted small">If enabled, users signing in with Google are linked to an existing Panel account when their verified Google email matches.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Auto Create New Accounts</label>
                                <div>
                                    <select class="form-control" name="services:google:auto_create_account">
                                        <option value="true" @if($autoCreate === 'true') selected @endif>Enabled</option>
                                        <option value="false" @if($autoCreate === 'false') selected @endif>Disabled</option>
                                    </select>
                                    <p class="text-muted small">If enabled, users with verified Google emails can create a new account on first SSO login.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-12">
                                <label class="control-label">Allowed Domains for Auto Creation (Optional)</label>
                                <div>
                                    <input
                                        type="text"
                                        class="form-control"
                                        name="services:google:allowed_domains"
                                        value="{{ old('services:google:allowed_domains', config('services.google.allowed_domains')) }}"
                                        placeholder="example.com, company.org"
                                    >
                                    <p class="text-muted small">If set, auto account creation is only allowed for verified emails from these domains.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="box box-primary">
                    <div class="box-footer">
                        {{ csrf_field() }}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection
