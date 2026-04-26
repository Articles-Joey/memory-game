import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET(req) {
    // Remove the 'sess' cookie by setting it to empty and expired
    // const response = NextResponse.rewrite(new URL('/', req.url))
    const cookieStore = await cookies()

    const session_token = cookieStore.get('sess')?.value
    console.log("session_token", session_token)

    // const c = cookieStore.delete('sess')
    // console.log("deleted cookie", c)

    cookieStore.set(
        'sess',
        '',
        {
            maxAge: 0, // 30 Days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: process.env.NODE_ENV === 'production' ? 'articles.media' : undefined,
            path: '/',
            sameSite: 'lax',
        }
    )

    // cookieStore.set('sess', '', {
    //     httpOnly: true,
    //     path: '/',
    //     expires: new Date(0),
    //     sameSite: 'lax',
    // });

    return NextResponse.json({
        message: 'Signed out successfully',
        // c
    });
    // redirect('/login');
}
