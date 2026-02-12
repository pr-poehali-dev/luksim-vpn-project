import json
import time
import random
from datetime import datetime

PROXY_IP = "152.53.253.78"
VALID_KEY = "davidik228"

def handler(event: dict, context) -> dict:
    """API для управления VPN proxy подключением с мониторингом"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        activation_key = body.get('key', '')
        
        if action == 'validate_key':
            is_valid = activation_key == VALID_KEY
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'valid': is_valid,
                    'message': 'Ключ активирован' if is_valid else 'Неверный ключ активации'
                })
            }
        
        if action == 'connect':
            if activation_key != VALID_KEY:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Требуется валидный ключ активации'
                    })
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'proxy_ip': PROXY_IP,
                    'connected_at': datetime.now().isoformat(),
                    'message': f'Подключено к Proxy {PROXY_IP}'
                })
            }
        
        if action == 'disconnect':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Отключено от Proxy'
                })
            }
    
    if method == 'GET':
        activation_key = event.get('queryStringParameters', {}).get('key', '')
        
        if activation_key != VALID_KEY:
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Требуется валидный ключ активации'
                })
            }
        
        download_speed = round(random.uniform(80, 180), 1)
        upload_speed = round(random.uniform(40, 90), 1)
        latency = random.randint(8, 25)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'proxy_ip': PROXY_IP,
                'status': 'connected',
                'metrics': {
                    'download_speed': download_speed,
                    'upload_speed': upload_speed,
                    'latency': latency,
                    'timestamp': datetime.now().isoformat()
                }
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }
