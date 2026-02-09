@extends('templates/wrapper', [
    'css' => ['body' => 'bg-neutral-900']
])

@section('container')
    <div class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md bg-neutral-800 rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-neutral-100 mb-6 text-center">Link Google Account</h2>
            
            @if ($errors->any())
                <div class="bg-red-500/20 text-red-200 p-4 rounded mb-6 border border-red-500/50">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <p class="text-neutral-300 mb-6 text-center">
                To link your Google account (<strong>{{ session('google_email') }}</strong>) to your existing account, please enter your password.
            </p>

            <form method="POST" action="{{ route('auth.google.link') }}">
                @csrf
                <div class="mb-6">
                    <label class="block text-neutral-300 text-sm font-bold mb-2" for="password">
                        Current Password
                    </label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-100 leading-tight focus:outline-none focus:shadow-outline bg-neutral-700 border-neutral-600 focus:border-cyan-500 transition-colors" id="password" type="password" name="password" required autofocus>
                </div>
                
                <div class="flex items-center justify-between">
                    <button class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors w-full" type="submit">
                        Link Account
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection
