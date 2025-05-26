#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebSocket处理器
实现AG-UI协议的实时通信
"""

import asyncio
import json
import hashlib
import base64
import struct
from typing import Dict, List, Optional, Callable
from ag_ui_protocol import AGUIProtocol, BaseEvent, EventType


class WebSocketFrame:
    """WebSocket帧处理"""
    
    @staticmethod
    def create_frame(payload: bytes, opcode: int = 1) -> bytes:
        """创建WebSocket帧"""
        frame = bytearray()
        
        # 第一个字节：FIN=1, RSV=000, opcode
        frame.append(0x80 | opcode)
        
        # 载荷长度
        payload_len = len(payload)
        if payload_len < 126:
            frame.append(payload_len)
        elif payload_len < 65536:
            frame.append(126)
            frame.extend(struct.pack('>H', payload_len))
        else:
            frame.append(127)
            frame.extend(struct.pack('>Q', payload_len))
        
        # 载荷数据
        frame.extend(payload)
        
        return bytes(frame)
    
    @staticmethod
    def parse_frame(data: bytes) -> Optional[bytes]:
        """解析WebSocket帧"""
        if len(data) < 2:
            return None
        
        # 解析头部
        fin = (data[0] & 0x80) >> 7
        opcode = data[0] & 0x0F
        masked = (data[1] & 0x80) >> 7
        payload_len = data[1] & 0x7F
        
        offset = 2
        
        # 扩展载荷长度
        if payload_len == 126:
            if len(data) < offset + 2:
                return None
            payload_len = struct.unpack('>H', data[offset:offset+2])[0]
            offset += 2
        elif payload_len == 127:
            if len(data) < offset + 8:
                return None
            payload_len = struct.unpack('>Q', data[offset:offset+8])[0]
            offset += 8
        
        # 掩码
        if masked:
            if len(data) < offset + 4:
                return None
            mask = data[offset:offset+4]
            offset += 4
        
        # 载荷数据
        if len(data) < offset + payload_len:
            return None
        
        payload = data[offset:offset+payload_len]
        
        # 解掩码
        if masked:
            payload = bytes(payload[i] ^ mask[i % 4] for i in range(len(payload)))
        
        return payload


class WebSocketConnection:
    """WebSocket连接管理"""
    
    def __init__(self, socket, address):
        self.socket = socket
        self.address = address
        self.connected = False
        self.buffer = b''
    
    def handshake(self, request_data: bytes) -> bool:
        """WebSocket握手"""
        try:
            request = request_data.decode('utf-8')
            lines = request.split('\r\n')
            
            print(f"收到握手请求: {lines[0] if lines else '空请求'}")
            
            # 解析请求头
            headers = {}
            for line in lines[1:]:
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.strip().lower()] = value.strip()
            
            print(f"请求头: {headers}")
            
            # 检查WebSocket升级请求
            upgrade_header = headers.get('upgrade', '').lower()
            connection_header = headers.get('connection', '').lower()
            
            print(f"Upgrade头: '{upgrade_header}', Connection头: '{connection_header}'")
            
            if upgrade_header != 'websocket' or 'upgrade' not in connection_header:
                print(f"握手失败: 不是WebSocket升级请求 (upgrade={upgrade_header}, connection={connection_header})")
                return False
            
            # 生成响应密钥
            websocket_key = headers.get('sec-websocket-key', '')
            if not websocket_key:
                print(f"握手失败: 缺少Sec-WebSocket-Key")
                return False
            
            # WebSocket魔法字符串
            magic_string = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
            response_key = base64.b64encode(
                hashlib.sha1((websocket_key + magic_string).encode()).digest()
            ).decode()
            
            # 发送握手响应
            response = (
                'HTTP/1.1 101 Switching Protocols\r\n'
                'Upgrade: websocket\r\n'
                'Connection: Upgrade\r\n'
                f'Sec-WebSocket-Accept: {response_key}\r\n'
                '\r\n'
            )
            
            self.socket.send(response.encode())
            self.connected = True
            print(f"WebSocket握手成功: {self.address}")
            return True
            
        except Exception as e:
            print(f"WebSocket握手异常: {e}")
            return False
    
    async def send_message(self, message: str):
        """发送消息"""
        if not self.connected:
            return
        
        try:
            frame = WebSocketFrame.create_frame(message.encode('utf-8'))
            self.socket.send(frame)
        except Exception as e:
            print(f"发送消息失败: {e}")
            self.connected = False
    
    async def receive_message(self) -> Optional[str]:
        """接收消息"""
        if not self.connected:
            return None
        
        try:
            data = self.socket.recv(1024)
            if not data:
                self.connected = False
                return None
            
            self.buffer += data
            payload = WebSocketFrame.parse_frame(self.buffer)
            
            if payload is not None:
                self.buffer = b''  # 清空缓冲区
                return payload.decode('utf-8')
            
            return None
            
        except Exception as e:
            print(f"接收消息失败: {e}")
            self.connected = False
            return None
    
    def close(self):
        """关闭连接"""
        self.connected = False
        try:
            self.socket.close()
        except:
            pass


class WebSocketHandler:
    """WebSocket处理器"""
    
    def __init__(self, ag_ui_protocol: AGUIProtocol):
        self.ag_ui_protocol = ag_ui_protocol
        self.connections: List[WebSocketConnection] = []
        self.message_handlers: Dict[str, Callable] = {}
        
        # 注册默认消息处理器
        self.register_message_handler('ping', self._handle_ping)
        self.register_message_handler('user_message', self._handle_user_message)
        self.register_message_handler('get_state', self._handle_get_state)
    
    def register_message_handler(self, message_type: str, handler: Callable):
        """注册消息处理器"""
        self.message_handlers[message_type] = handler
    
    async def handle_connection(self, socket, address, request_data=None):
        """处理新的WebSocket连接"""
        print(f"新的WebSocket连接: {address}")
        
        connection = WebSocketConnection(socket, address)
        
        # 处理握手
        try:
            # 如果没有提供request_data，则从socket接收
            if request_data is None:
                request_data = socket.recv(1024)
            
            if not connection.handshake(request_data):
                print(f"WebSocket握手失败: {address}")
                socket.close()
                return
        except Exception as e:
            print(f"处理握手失败: {e}")
            socket.close()
            return
        
        # 添加到连接列表
        self.connections.append(connection)
        
        # 发送欢迎消息
        welcome_event = {
            'type': 'CUSTOM',
            'data': {
                'message': '欢迎使用AG-UI原生实现！',
                'timestamp': int(asyncio.get_event_loop().time() * 1000)
            }
        }
        await connection.send_message(json.dumps(welcome_event, ensure_ascii=False))
        
        # 消息循环
        try:
            while connection.connected:
                message = await connection.receive_message()
                if message:
                    await self._handle_message(connection, message)
                await asyncio.sleep(0.01)  # 避免CPU占用过高
        except Exception as e:
            print(f"处理连接时出错: {e}")
        finally:
            # 清理连接
            if connection in self.connections:
                self.connections.remove(connection)
            connection.close()
            print(f"WebSocket连接关闭: {address}")
    
    async def _handle_message(self, connection: WebSocketConnection, message: str):
        """处理接收到的消息"""
        try:
            data = json.loads(message)
            message_type = data.get('type', '')
            
            if message_type in self.message_handlers:
                await self.message_handlers[message_type](connection, data)
            else:
                print(f"未知消息类型: {message_type}")
                
        except json.JSONDecodeError:
            print(f"无效的JSON消息: {message}")
        except Exception as e:
            print(f"处理消息时出错: {e}")
    
    async def _handle_ping(self, connection: WebSocketConnection, data: Dict):
        """处理ping消息"""
        pong_message = {
            'type': 'pong',
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        await connection.send_message(json.dumps(pong_message))
    
    async def _handle_user_message(self, connection: WebSocketConnection, data: Dict):
        """处理用户消息"""
        content = data.get('content', '')
        if not content:
            return
        
        # 广播用户消息给所有连接
        user_message_event = {
            'type': 'TEXT_MESSAGE_START',
            'message_id': f"user_{int(asyncio.get_event_loop().time() * 1000)}",
            'role': 'user',
            'content': content,
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        
        await self.broadcast_event(user_message_event)
        
        # 模拟智能体响应（这里可以集成真实的AI模型）
        await self._simulate_agent_response(content)
    
    async def _handle_get_state(self, connection: WebSocketConnection, data: Dict):
        """处理获取状态请求"""
        state_event = {
            'type': 'STATE_SNAPSHOT',
            'state': self.ag_ui_protocol.get_state(),
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        await connection.send_message(json.dumps(state_event, ensure_ascii=False))
    
    async def _simulate_agent_response(self, user_input: str):
        """模拟智能体响应"""
        # 简单的响应逻辑
        responses = {
            '你好': '你好！我是AG-UI智能助手，很高兴为您服务！',
            'hello': 'Hello! I am an AG-UI assistant. How can I help you?',
            '时间': f'当前时间是: {asyncio.get_event_loop().time()}',
            '帮助': '我可以帮助您测试AG-UI协议的各种功能，包括文本消息、工具调用和状态管理。'
        }
        
        # 查找匹配的响应
        response = None
        for key, value in responses.items():
            if key.lower() in user_input.lower():
                response = value
                break
        
        if not response:
            response = f'您说: "{user_input}"。这是一个演示响应，展示AG-UI协议的消息传递功能。'
        
        # 创建智能体响应事件
        message_id = f"agent_{int(asyncio.get_event_loop().time() * 1000)}"
        
        # 发送消息开始事件
        start_event = {
            'type': 'TEXT_MESSAGE_START',
            'message_id': message_id,
            'role': 'assistant',
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        await self.broadcast_event(start_event)
        
        # 模拟流式响应
        words = response.split()
        for i, word in enumerate(words):
            content_event = {
                'type': 'TEXT_MESSAGE_CONTENT',
                'message_id': message_id,
                'content': word + (' ' if i < len(words) - 1 else ''),
                'timestamp': int(asyncio.get_event_loop().time() * 1000)
            }
            await self.broadcast_event(content_event)
            await asyncio.sleep(0.1)  # 模拟打字效果
        
        # 发送消息结束事件
        end_event = {
            'type': 'TEXT_MESSAGE_END',
            'message_id': message_id,
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        await self.broadcast_event(end_event)
    
    async def broadcast_event(self, event: Dict):
        """广播事件给所有连接"""
        message = json.dumps(event, ensure_ascii=False)
        
        # 移除已断开的连接
        active_connections = []
        for connection in self.connections:
            if connection.connected:
                try:
                    await connection.send_message(message)
                    active_connections.append(connection)
                except:
                    connection.close()
            else:
                connection.close()
        
        self.connections = active_connections
    
    def get_connection_count(self) -> int:
        """获取活跃连接数"""
        return len([conn for conn in self.connections if conn.connected])