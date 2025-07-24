@extends('layouts.admin')

@section('title')
    Egg Changer
@endsection

@section('content-header')
    <h1>Egg Changer
        <small>Set available and default eggs.</small>
    </h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Egg Changer</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12 col-lg-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Update Selectable Eggs</h3>
                </div>
                <form method="post" action="{{ route('admin.eggchanger.availables') }}">
                    <div class="box-body">
                        <div class="form-group">
                            <label for="selectableEggs">Eggs</label>
                            <select id="selectableEggs" name="eggs[]" class="form-control" multiple>
                                @foreach ($eggs as $egg)
                                    <option value="{{ $egg->id }}" {{ $egg->selected }}>{{ $egg->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button class="btn btn-success btn-sm pull-right">Update</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="col-xs-12 col-lg-6">
            <div class="box box-warning">
                <div class="box-header with-border">
                    <h3 class="box-title">Update Default Eggs</h3>
                </div>
                <form method="post" action="{{ route('admin.eggchanger.defaults') }}">
                    <div class="box-body">
                        <div class="form-group">
                            <label for="defaultEggs">Eggs</label>
                            <select id="defaultEggs" name="eggs[]" class="form-control" multiple>
                                @foreach ($available_eggs as $egg)
                                    <option value="{{ $egg->id }}" {{ $egg->selected }}>{{ $egg->egg->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button class="btn btn-success btn-sm pull-right">Update</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#selectableEggs').select2({
            placeholder: 'Selectable Eggs'
        });

        $('#defaultEggs').select2({
            placeholder: 'Selectable Eggs'
        });
    </script>
@endsection
