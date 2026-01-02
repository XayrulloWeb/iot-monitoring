// src/utils/errorMessages.js

/**
 * Словарь user-friendly сообщений об ошибках
 */
export const ERROR_MESSAGES = {
    // Ошибки сети
    'Network Error': 'Нет подключения к серверу. Проверьте интернет-соединение.',
    'ERR_NETWORK': 'Нет подключения к серверу. Проверьте интернет-соединение.',
    'ECONNREFUSED': 'Сервер недоступен. Попробуйте позже.',
    'ETIMEDOUT': 'Превышено время ожидания ответа от сервера.',

    // Ошибки авторизации
    'Unauthorized': 'Неверное имя пользователя или пароль.',
    'Invalid credentials': 'Неверное имя пользователя или пароль.',
    'Token expired': 'Ваша сессия истекла. Пожалуйста, войдите снова.',
    'Invalid token': 'Недействительный токен. Пожалуйста, войдите снова.',

    // Ошибки доступа
    'Forbidden': 'У вас нет прав для выполнения этого действия.',
    'Access denied': 'Доступ запрещен.',

    // Ошибки данных
    'Not Found': 'Запрашиваемые данные не найдены.',
    'Validation Error': 'Проверьте правильность введенных данных.',
    'Bad Request': 'Неверный формат запроса.',

    // Серверные ошибки
    'Internal Server Error': 'Ошибка сервера. Мы уже работаем над её устранением.',
    'Service Unavailable': 'Сервис временно недоступен. Попробуйте позже.',
    'Bad Gateway': 'Ошибка шлюза. Попробуйте позже.',
    'Gateway Timeout': 'Сервер не отвечает. Попробуйте позже.',
};

/**
 * Получить понятное пользователю сообщение об ошибке
 * @param {Error|Object} error - Объект ошибки
 * @returns {string} - User-friendly сообщение
 */
export function getUserFriendlyErrorMessage(error) {
    if (!error) {
        return 'Произошла неизвестная ошибка.';
    }

    // Если это axios error
    if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;

        // Проверяем message в словаре
        if (message && ERROR_MESSAGES[message]) {
            return ERROR_MESSAGES[message];
        }

        // Стандартные HTTP статусы
        switch (status) {
            case 400:
                return ERROR_MESSAGES['Bad Request'];
            case 401:
                return ERROR_MESSAGES['Unauthorized'];
            case 403:
                return ERROR_MESSAGES['Forbidden'];
            case 404:
                return ERROR_MESSAGES['Not Found'];
            case 500:
                return ERROR_MESSAGES['Internal Server Error'];
            case 502:
                return ERROR_MESSAGES['Bad Gateway'];
            case 503:
                return ERROR_MESSAGES['Service Unavailable'];
            case 504:
                return ERROR_MESSAGES['Gateway Timeout'];
            default:
                return `Ошибка сервера (${status}). Попробуйте позже.`;
        }
    }

    // Если это сетевая ошибка
    if (error.code) {
        if (ERROR_MESSAGES[error.code]) {
            return ERROR_MESSAGES[error.code];
        }
    }

    // Проверяем message напрямую
    if (error.message && ERROR_MESSAGES[error.message]) {
        return ERROR_MESSAGES[error.message];
    }

    // Если ничего не подошло, возвращаем общее сообщение
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
}

/**
 * Получить рекомендацию по действиям для пользователя
 * @param {Error|Object} error - Объект ошибки
 * @returns {string|null} - Рекомендация или null
 */
export function getErrorActionHint(error) {
    if (!error) return null;

    const status = error.response?.status;
    const code = error.code;

    if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
        return 'Проверьте подключение к интернету и попробуйте снова.';
    }

    if (status === 401) {
        return 'Войдите в систему для продолжения работы.';
    }

    if (status === 403) {
        return 'Обратитесь к администратору для получения доступа.';
    }

    if (status === 404) {
        return 'Убедитесь, что URL адрес правильный.';
    }

    if (status >= 500) {
        return 'Подождите несколько минут и попробуйте снова.';
    }

    return null;
}
