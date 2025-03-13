'use client'
import React from 'react'
import { Button } from "antd";
// import { auth } from '@/config/auth';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
// import { signOut,signIn } from '@/config/auth';

export default function ButtonLogInOut() {
    const session = useSession()
    // console.log(session)
    if (session.status == 'authenticated') {
        return (
            <Button type="primary" danger onClick={async () => {
                console.log('logOut');
                await signOut({ redirect: true, redirectTo: "/" })
            }}>
                Выйти
            </Button>
        )
    } else {
        return (
            <Link href={'/login'}>
                <Button type="primary"
                // onClick={async () => {
                //     console.log('logIn');
                //     try {
                //         await signIn('credentials', { username: "123", password: '321' })                    
                //     } catch (error) {
                //         console.log(error)
                //     }
                // }}
                >
                    Войти
                </Button>
            </Link>
        )
    }
}
