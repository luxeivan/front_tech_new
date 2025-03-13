'use client'
import React from 'react'
import { Modal } from 'antd'
import AuthForm from '@/components/client/global/AuthForm'

export default function ModalAuth() {
    return (
        <Modal title="Авторизация" open={isOpenModalAuth} footer={null} onCancel={() => { closeModal() }}>
            <AuthForm closeModal={closeModal} />
        </Modal>
    )
}
