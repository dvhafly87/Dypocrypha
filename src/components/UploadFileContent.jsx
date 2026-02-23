import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../config/apiConfig.js';

export default function UploadFileContent() {
    const { fileUuid } = useParams();

    useEffect(() => {
    const getFileUploadInformation = async() => {
        try {
        
        } catch(error) {
        
        }
    }
    getFileUploadInformation();
    }, [fileUuid]);

    return (
        <>

        </>
    )
}   