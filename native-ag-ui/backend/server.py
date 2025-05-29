#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AG-UI原生后端服务器
提供HTTP API和WebSocket实时通信
"""

import asyncio
import socket
import threading
import json
import os
from urllib.parse import urlparse, parse_qs
from ag_ui_protocol import AGUIProtocol
from websocket_handler import WebSocketHandler
from agent_simulator import AgentSimulator


class HTTPServer:
    """简单的HTTP服务器"""
    
    def __init__(self, host='localhost', port=8000):
        self.host = host
        self.port = port
        self.ag_ui_protocol = AGUIProtocol()
        self.agent_simulator = AgentSimulator(self.ag_ui_protocol)
        self.websocket_handler = WebSocketHandler(self.ag_ui_protocol, self.agent_simulator)
        self.running = False
        
        # 注册AG-UI协议事件处理器，将事件转发到WebSocket
        self._setup_event_handlers()
    
    def _setup_event_handlers(self):
        """设置AG-UI协议事件处理器"""
        # 注册所有事件类型的处理器，将事件转发到WebSocket
        from ag_ui_protocol import EventType
        
        def forward_to_websocket(event):
            """将AG-UI事件转发到WebSocket"""
            try:
                # 将事件转换为字典格式并异步广播
                event_dict = {
                    'type': event.event_type.value,
                    'timestamp': event.timestamp
                }
                
                # 根据事件类型添加特定字段
                if hasattr(event, 'message_id'):
                    event_dict['message_id'] = event.message_id
                if hasattr(event, 'role'):
                    event_dict['role'] = event.role
                if hasattr(event, 'content'):
                    event_dict['content'] = event.content
                if hasattr(event, 'call_id'):
                    event_dict['call_id'] = event.call_id
                if hasattr(event, 'tool_name'):
                    event_dict['tool_name'] = event.tool_name
                if hasattr(event, 'arguments'):
                    event_dict['arguments'] = event.arguments
                if hasattr(event, 'result'):
                    event_dict['result'] = event.result
                if hasattr(event, 'state'):
                    event_dict['state'] = event.state
                if hasattr(event, 'delta'):
                    event_dict['delta'] = event.delta
                if hasattr(event, 'data'):
                    event_dict['data'] = event.data
                
                # 创建异步任务来广播事件
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.websocket_handler.broadcast_event(event_dict))
                except RuntimeError:
                    # 如果没有运行的事件循环，创建一个新的
                    asyncio.create_task(self.websocket_handler.broadcast_event(event_dict))
            except Exception as e:
                print(f"❌ 转发事件到WebSocket时出错: {e}")
        
        # 为所有事件类型注册处理器
        for event_type in EventType:
            self.ag_ui_protocol.register_handler(event_type, forward_to_websocket)
    
    def start(self):
        """启动服务器"""
        self.running = True
        
        # 创建服务器socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((self.host, self.port))
        server_socket.listen(5)
        
        print(f"🚀 AG-UI服务器启动成功!")
        print(f"📡 HTTP服务: http://{self.host}:{self.port}")
        print(f"🔌 WebSocket服务: ws://{self.host}:{self.port}/ws")
        print(f"📁 前端界面: http://{self.host}:{self.port}/")
        print("\n按 Ctrl+C 停止服务器")
        
        try:
            while self.running:
                try:
                    client_socket, address = server_socket.accept()
                    # 在新线程中处理每个连接
                    thread = threading.Thread(
                        target=self._handle_client,
                        args=(client_socket, address)
                    )
                    thread.daemon = True
                    thread.start()
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    print(f"接受连接时出错: {e}")
        
        except KeyboardInterrupt:
            print("\n🛑 服务器正在关闭...")
        finally:
            self.running = False
            server_socket.close()
            print("✅ 服务器已关闭")
    
    def _handle_client(self, client_socket, address):
        """处理客户端连接"""
        is_websocket = False
        try:
            # 接收请求数据
            request_data = client_socket.recv(4096)
            if not request_data:
                return
            
            request_str = request_data.decode('utf-8')
            lines = request_str.split('\r\n')
            
            if not lines:
                return
            
            # 解析请求行
            request_line = lines[0]
            method, path, protocol = request_line.split(' ', 2)
            
            # 解析请求头
            headers = {}
            for line in lines[1:]:
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.strip().lower()] = value.strip()
            
            # 检查是否为WebSocket升级请求
            if (headers.get('upgrade', '').lower() == 'websocket' and
                headers.get('connection', '').lower() == 'upgrade'):
                # 处理WebSocket连接
                is_websocket = True
                # 创建新线程来处理WebSocket连接
                ws_thread = threading.Thread(
                    target=self._handle_websocket_connection,
                    args=(client_socket, address, request_data)
                )
                ws_thread.daemon = True
                ws_thread.start()
                return
            
            # 处理HTTP请求
            self._handle_http_request(client_socket, method, path, headers)
            
        except Exception as e:
            print(f"处理客户端请求时出错: {e}")
        finally:
            # 只有非WebSocket连接才关闭socket
            if not is_websocket:
                try:
                    client_socket.close()
                except:
                    pass
    
    def _handle_websocket_connection(self, client_socket, address, request_data):
        """处理WebSocket连接（在新线程中运行）"""
        try:
            # 创建新的事件循环
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # 运行WebSocket处理器
            loop.run_until_complete(
                self.websocket_handler.handle_connection(client_socket, address, request_data)
            )
        except Exception as e:
            print(f"WebSocket连接处理失败: {e}")
        finally:
            try:
                loop.close()
            except:
                pass
    
    def _handle_http_request(self, client_socket, method, path, headers):
        """处理HTTP请求"""
        try:
            # 解析URL
            parsed_url = urlparse(path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)
            
            # 路由处理
            if path == '/' or path == '/index.html':
                self._serve_file(client_socket, '../frontend/index.html', 'text/html')
            elif path == '/style.css':
                self._serve_file(client_socket, '../frontend/style.css', 'text/css')
            elif path == '/script.js':
                self._serve_file(client_socket, '../frontend/script.js', 'application/javascript')
            elif path == '/ag-ui-client.js':
                self._serve_file(client_socket, '../frontend/ag-ui-client.js', 'application/javascript')
            elif path == '/api/status':
                self._handle_api_status(client_socket)
            elif path == '/api/events' and method == 'POST':
                self._handle_api_events(client_socket, headers)
            elif path == '/api/state':
                self._handle_api_state(client_socket)
            elif path == '/api/generate-ui' and method == 'POST':
                self._handle_api_generate_ui(client_socket, headers)
            else:
                self._send_404(client_socket)
                
        except Exception as e:
            print(f"处理HTTP请求时出错: {e}")
            self._send_500(client_socket)
    
    def _serve_file(self, client_socket, file_path, content_type):
        """提供静态文件服务"""
        try:
            # 获取当前脚本目录
            current_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.join(current_dir, file_path)
            
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                response = (
                    'HTTP/1.1 200 OK\r\n'
                    f'Content-Type: {content_type}; charset=utf-8\r\n'
                    f'Content-Length: {len(content.encode("utf-8"))}\r\n'
                    'Access-Control-Allow-Origin: *\r\n'
                    'Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n'
                    'Access-Control-Allow-Headers: Content-Type\r\n'
                    '\r\n'
                    f'{content}'
                )
                client_socket.send(response.encode('utf-8'))
            else:
                self._send_404(client_socket)
                
        except Exception as e:
            print(f"提供文件服务时出错: {e}")
            self._send_500(client_socket)
    
    def _handle_api_status(self, client_socket):
        """处理状态API请求"""
        status_data = {
            'status': 'running',
            'connections': self.websocket_handler.get_connection_count(),
            'protocol_version': '1.0',
            'features': [
                'websocket',
                'text_messages',
                'tool_calls',
                'state_management'
            ]
        }
        
        self._send_json_response(client_socket, status_data)
    
    def _handle_api_events(self, client_socket, headers):
        """处理事件API请求"""
        # 这里可以实现事件推送逻辑
        response_data = {
            'message': 'Event API endpoint',
            'note': 'Use WebSocket for real-time events'
        }
        
        self._send_json_response(client_socket, response_data)
    
    def _handle_api_state(self, client_socket):
        """处理状态API请求"""
        state_data = {
            'state': self.ag_ui_protocol.get_state(),
            'timestamp': int(asyncio.get_event_loop().time() * 1000) if asyncio._get_running_loop() else 0
        }
        
        self._send_json_response(client_socket, state_data)
    
    def _handle_api_generate_ui(self, client_socket, headers):
        """处理动态UI生成API请求"""
        try:
            # 读取请求体
            content_length = int(headers.get('content-length', 0))
            if content_length > 0:
                request_body = client_socket.recv(content_length).decode('utf-8')
                request_data = json.loads(request_body)
                
                content = request_data.get('content', '')
                context = request_data.get('context', {})
                
                # 模拟动态UI生成逻辑
                ui_components = self._generate_ui_components(content, context)
                
                response_data = {
                    'success': True,
                    'components': ui_components,
                    'timestamp': int(asyncio.get_event_loop().time() * 1000) if asyncio._get_running_loop() else 0
                }
            else:
                response_data = {
                    'success': False,
                    'error': 'Missing request body'
                }
                
        except Exception as e:
            response_data = {
                'success': False,
                'error': str(e)
            }
        
        self._send_json_response(client_socket, response_data)
    
    def _generate_ui_components(self, content, context):
        """生成UI组件配置"""
        components = []
        
        # 检测进度信息
        import re
        progress_match = re.search(r'(\d+)%', content)
        if progress_match:
            progress = int(progress_match.group(1))
            components.append({
                'type': 'progress_tracker',
                'data': {
                    'progress': progress,
                    'description': content,
                    'status': 'active' if progress < 100 else 'completed'
                }
            })
        
        # 检测代码块
        code_matches = re.findall(r'```([\s\S]*?)```', content)
        for code in code_matches:
            components.append({
                'type': 'code_block',
                'data': {
                    'code': code.strip(),
                    'language': self._detect_language(code)
                }
            })
        
        # 检测任务列表
        if any(keyword in content.lower() for keyword in ['任务', 'task', '步骤', 'step']):
            tasks = self._extract_tasks(content)
            if tasks:
                components.append({
                    'type': 'task_list',
                    'data': {
                        'tasks': tasks
                    }
                })
        
        # 检测数据可视化需求
        if any(keyword in content.lower() for keyword in ['图表', 'chart', '数据', 'data', '统计']):
            components.append({
                'type': 'data_visualization',
                'data': {
                    'description': content,
                    'chart_type': 'bar',
                    'data': self._extract_numbers(content)
                }
            })
        
        return components
    
    def _detect_language(self, code):
        """检测代码语言"""
        code_lower = code.lower()
        if 'function' in code_lower or 'const' in code_lower or 'let' in code_lower:
            return 'javascript'
        elif 'def ' in code_lower or 'import ' in code_lower:
            return 'python'
        elif 'public class' in code_lower or 'system.out' in code_lower:
            return 'java'
        elif '#include' in code_lower or 'int main' in code_lower:
            return 'cpp'
        return 'text'
    
    def _extract_tasks(self, content):
        """从内容中提取任务列表"""
        lines = content.split('\n')
        tasks = []
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith(('-', '*', '+')) or any(char.isdigit() for char in line[:3])):
                # 清理任务文本
                task_text = re.sub(r'^[\d\-\*\+\s]+', '', line).strip()
                if task_text:
                    completed = '✓' in task_text or '完成' in task_text
                    tasks.append({
                        'text': task_text,
                        'completed': completed
                    })
        
        return tasks
    
    def _extract_numbers(self, content):
        """从内容中提取数字数据"""
        import re
        numbers = re.findall(r'\d+', content)
        return [int(num) for num in numbers[:10]]  # 最多返回10个数字
    
    def _send_json_response(self, client_socket, data):
        """发送JSON响应"""
        json_data = json.dumps(data, ensure_ascii=False)
        response = (
            'HTTP/1.1 200 OK\r\n'
            'Content-Type: application/json; charset=utf-8\r\n'
            f'Content-Length: {len(json_data.encode("utf-8"))}\r\n'
            'Access-Control-Allow-Origin: *\r\n'
            'Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n'
            'Access-Control-Allow-Headers: Content-Type\r\n'
            '\r\n'
            f'{json_data}'
        )
        client_socket.send(response.encode('utf-8'))
    
    def _send_404(self, client_socket):
        """发送404响应"""
        response = (
            'HTTP/1.1 404 Not Found\r\n'
            'Content-Type: text/html; charset=utf-8\r\n'
            'Access-Control-Allow-Origin: *\r\n'
            '\r\n'
            '<html><body><h1>404 - 页面未找到</h1></body></html>'
        )
        client_socket.send(response.encode('utf-8'))
    
    def _send_500(self, client_socket):
        """发送500响应"""
        response = (
            'HTTP/1.1 500 Internal Server Error\r\n'
            'Content-Type: text/html; charset=utf-8\r\n'
            'Access-Control-Allow-Origin: *\r\n'
            '\r\n'
            '<html><body><h1>500 - 服务器内部错误</h1></body></html>'
        )
        client_socket.send(response.encode('utf-8'))


def main():
    """主函数"""
    print("🤖 AG-UI原生实现服务器")
    print("=" * 40)
    
    # 创建并启动服务器
    server = HTTPServer(host='localhost', port=8000)
    
    try:
        server.start()
    except KeyboardInterrupt:
        print("\n👋 再见！")
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")


if __name__ == '__main__':
    main()