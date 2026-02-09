@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'google'])

@section('title')
    Google SSO Settings
@endsection

@section('content-header')
    <h1>Google SSO Settings<small>Configure Google Single Sign-On for your panel.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Google SSO Configuration</h3>
                </div>
                <form action="{{ route('admin.settings.google') }}" method="POST">
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label class="control-label">Status</label>
                                <div>
                                    <select name="services:google:enabled" class="form-control">
                                        <option value="false" @if(config('services.google.enabled') == false) selected @endif>Disabled</option>
                                        <option value="true" @if(config('services.google.enabled') == true) selected @endif>Enabled</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Client ID</label>
                                <div>
                                    <input type="text" class="form-control" name="services:google:client_id" value="{{ config('services.google.client_id') }}" />
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Client Secret</label>
                                <div>
                                    <input type="password" class="form-control" name="services:google:client_secret" value="{{ config('services.google.client_secret') }}" />
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label class="control-label">Redirect URI</label>
                                <div>
                                    <input type="text" class="form-control" name="services:google:redirect" value="{{ config('services.google.redirect') }}" placeholder="{{ url('/auth/google/callback') }}" />
                                    <p class="text-muted"><small>Set this to <code>{{ url('/auth/google/callback') }}</code> in your Google Cloud Console. Leave empty to use default.</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
