import API from '../config/apiConfig.js';

export const onUploadImage = ({
    blob,
    onSuccess,
    onError,
    signal,
    projectValue = false,
    projectReportValue = false
}) => {
    const controller = new AbortController();

    const upload = async () => {
        try {
            const formData = new FormData();
            formData.append('image', blob, blob.name ?? 'image.png');
            formData.append('projectValue', projectValue);
            formData.append('projectReportValue', projectReportValue);

            const response = await fetch(
                `${API.API_BASE_URL}/api/upload/image`,
                {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                    signal: signal ?? controller.signal
                }
            );

            if (response.status === 413) {
                throw new Error('파일이 너무 큽니다. 5MB 이하의 파일로 선택해주십시오');
            }

            if (!response.ok) {
                throw new Error('서버 통신 불가');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '업로드 실패');
            }

            // CKEditor UploadAdapter 스타일

            const fullUrl = result.url.startsWith('http')
                ? result.url
                : `${API.API_BASE_URL}${result.url}`;

            onSuccess?.({ default: fullUrl });
            return { default: fullUrl };
        } catch (err) {
            onError?.(err);
            throw err;
        }
    };

    return {
        upload,
        abort: () => controller.abort()
    };
};
