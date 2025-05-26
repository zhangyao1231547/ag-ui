#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AG-UI 代理模拟器
模拟AI代理的响应和行为，用于演示AG-UI协议的功能
"""

import asyncio
import json
import random
import time
import os
from typing import Dict, List, Any, Optional
from openai import OpenAI
from ag_ui_protocol import AGUIProtocol, EventType

class AgentSimulator:
    """AI代理模拟器"""
    
    def __init__(self, protocol: AGUIProtocol):
        self.protocol = protocol
        self.conversation_history: List[Dict[str, Any]] = []
        self.agent_state = {
            'name': 'AG-UI Assistant',
            'version': '1.0.0',
            'capabilities': ['text_generation', 'tool_calling', 'state_management'],
            'status': 'ready',
            'last_activity': time.time()
        }
        
        # 初始化通义千问客户端
        self.qwen_client = OpenAI(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        
        # 预定义的响应模板
        self.response_templates = {
            'greeting': [
                "你好！我是AG-UI助手，很高兴为您服务。有什么我可以帮助您的吗？",
                "欢迎使用AG-UI！我可以帮您处理各种任务，请告诉我您需要什么帮助。",
                "您好！我是基于AG-UI协议的智能助手，随时为您提供帮助。"
            ],
            'help': [
                "我可以帮您：\n1. 回答问题\n2. 处理文本任务\n3. 演示AG-UI协议功能\n4. 管理对话状态",
                "以下是我的主要功能：\n• 智能对话\n• 工具调用\n• 状态同步\n• 事件处理",
                "我支持多种操作：\n- 文本生成\n- 状态管理\n- 实时通信\n- 协议演示"
            ],
            'default': [
                "这是一个很有趣的问题。让我为您详细解答...",
                "根据您的问题，我认为...",
                "这个话题很值得探讨。从我的角度来看...",
                "让我来帮您分析一下这个问题..."
            ],
            'tool_demo': [
                "让我演示一下工具调用功能...",
                "我将使用一些工具来处理您的请求...",
                "正在调用相关工具来完成任务..."
            ]
        }
        
        # 模拟工具
        self.available_tools = {
            'get_weather': {
                'name': 'get_weather',
                'description': '获取指定城市的天气信息',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'city': {'type': 'string', 'description': '城市名称'}
                    },
                    'required': ['city']
                }
            },
            'calculate': {
                'name': 'calculate',
                'description': '执行数学计算',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'expression': {'type': 'string', 'description': '数学表达式'}
                    },
                    'required': ['expression']
                }
            },
            'search_web': {
                'name': 'search_web',
                'description': '搜索网络信息',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'query': {'type': 'string', 'description': '搜索关键词'}
                    },
                    'required': ['query']
                }
            }
        }
    
    async def process_user_message(self, message: str, user_id: str = 'user') -> None:
        """处理用户消息"""
        print(f"🤖 代理收到消息: {message}")
        
        # 记录用户消息
        self.conversation_history.append({
            'role': 'user',
            'content': message,
            'timestamp': time.time(),
            'user_id': user_id
        })
        
        # 更新状态
        self.agent_state['last_activity'] = time.time()
        self.agent_state['status'] = 'processing'
        
        # 发送状态更新
        await self._send_state_update()
        
        # 分析消息并生成响应
        response_type = self._analyze_message(message)
        
        if response_type == 'tool_required':
            await self._handle_tool_calling(message)
        else:
            await self._generate_text_response(message, response_type)
        
        # 更新状态为就绪
        self.agent_state['status'] = 'ready'
        await self._send_state_update()
    
    def _analyze_message(self, message: str) -> str:
        """分析消息类型"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['你好', 'hello', 'hi', '您好']):
            return 'greeting'
        elif any(word in message_lower for word in ['帮助', 'help', '功能', '能做什么']):
            return 'help'
        elif any(word in message_lower for word in ['天气', 'weather', '计算', 'calculate', '搜索', 'search']):
            return 'tool_required'
        elif any(word in message_lower for word in ['工具', 'tool', '演示', 'demo']):
            return 'tool_demo'
        else:
            return 'default'
    
    async def _generate_text_response(self, message: str, response_type: str) -> None:
        """生成文本响应"""
        try:
            # 检查API密钥是否配置
            api_key = os.getenv("DASHSCOPE_API_KEY")
            if not api_key:
                print("⚠️ DASHSCOPE_API_KEY 未配置，使用模板响应")
                raise Exception("API密钥未配置")
            
            print(f"🔄 正在调用通义千问API生成响应...")
            # 使用通义千问生成响应
            response_content = await self._generate_qwen_response(message, response_type)
            print(f"✅ 通义千问API调用成功")
        except Exception as e:
            print(f"⚠️ 通义千问API调用失败: {e}")
            print(f"🔄 降级到模板响应")
            # 降级到模板响应
            templates = self.response_templates.get(response_type, self.response_templates['default'])
            response_content = random.choice(templates)
            if response_type == 'default':
                response_content += f"\n\n关于您提到的'{message}'，这确实是一个值得深入讨论的话题。"
        
        # 发送流式响应
        await self._send_streaming_response(response_content)
    
    async def _send_streaming_response(self, content: str) -> None:
        """发送流式响应"""
        message_id = f"assistant_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        
        # 发送消息开始事件
        await self.protocol.emit_text_message_start(
            message_id=message_id,
            role='assistant'
        )
        
        # 模拟打字延迟，分块发送内容
        words = content.split()
        current_content = ""
        
        for i, word in enumerate(words):
            current_content += word
            if i < len(words) - 1:
                current_content += " "
            
            # 发送内容块
            await self.protocol.emit_event(EventType.TEXT_MESSAGE_CONTENT, {
                'message_id': message_id,
                'content': word + (" " if i < len(words) - 1 else ""),
                'timestamp': time.time()
            })
            
            # 模拟打字延迟
            await asyncio.sleep(random.uniform(0.05, 0.15))
        
        # 发送消息结束事件
        await self.protocol.emit_event(EventType.TEXT_MESSAGE_END, {
            'message_id': message_id,
            'content': current_content,
            'timestamp': time.time()
        })
        
        # 记录助手消息
        self.conversation_history.append({
            'role': 'assistant',
            'content': current_content,
            'timestamp': time.time(),
            'message_id': message_id
        })
    
    async def _handle_tool_calling(self, message: str) -> None:
        """处理工具调用"""
        # 分析需要调用的工具
        tool_name, tool_args = self._determine_tool_call(message)
        
        if not tool_name:
            await self._generate_text_response(message, 'default')
            return
        
        # 发送工具调用开始事件
        call_id = f"call_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        
        await self.protocol.emit_event(EventType.TOOL_CALL_START, {
            'call_id': call_id,
            'tool_name': tool_name,
            'arguments': tool_args,
            'timestamp': time.time()
        })
        
        # 模拟工具执行延迟
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        # 执行工具调用
        tool_result = await self._execute_tool(tool_name, tool_args)
        
        # 发送工具调用结果事件
        await self.protocol.emit_event(EventType.TOOL_CALL_END, {
            'call_id': call_id,
            'tool_name': tool_name,
            'result': tool_result,
            'timestamp': time.time()
        })
        
        # 基于工具结果生成响应
        response = self._generate_tool_response(tool_name, tool_result)
        await self._send_streaming_response(response)
    
    def _determine_tool_call(self, message: str) -> tuple[Optional[str], Dict[str, Any]]:
        """确定需要调用的工具"""
        message_lower = message.lower()
        
        if '天气' in message_lower or 'weather' in message_lower:
            # 尝试提取城市名称
            city = '北京'  # 默认城市
            for word in message.split():
                if len(word) > 1 and word not in ['天气', '查询', '获取', '的']:
                    city = word
                    break
            return 'get_weather', {'city': city}
        
        elif '计算' in message_lower or 'calculate' in message_lower:
            # 尝试提取数学表达式
            expression = '2 + 2'  # 默认表达式
            # 简单的表达式提取逻辑
            import re
            math_pattern = r'[0-9+\-*/()\s]+'
            matches = re.findall(math_pattern, message)
            if matches:
                expression = matches[0].strip()
            return 'calculate', {'expression': expression}
        
        elif '搜索' in message_lower or 'search' in message_lower:
            # 提取搜索关键词
            query = message.replace('搜索', '').replace('search', '').strip()
            if not query:
                query = 'AG-UI协议'
            return 'search_web', {'query': query}
        
        return None, {}
    
    async def _execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """执行工具调用"""
        if tool_name == 'get_weather':
            city = args.get('city', '北京')
            return {
                'city': city,
                'temperature': random.randint(15, 30),
                'condition': random.choice(['晴朗', '多云', '小雨', '阴天']),
                'humidity': random.randint(40, 80),
                'wind_speed': random.randint(5, 20)
            }
        
        elif tool_name == 'calculate':
            expression = args.get('expression', '2 + 2')
            try:
                # 安全的数学计算
                allowed_chars = set('0123456789+-*/().')
                if all(c in allowed_chars or c.isspace() for c in expression):
                    result = eval(expression)
                    return {'expression': expression, 'result': result}
                else:
                    return {'expression': expression, 'error': '不支持的字符'}
            except Exception as e:
                return {'expression': expression, 'error': str(e)}
        
        elif tool_name == 'search_web':
            query = args.get('query', '')
            return {
                'query': query,
                'results': [
                    {'title': f'{query} - 相关结果1', 'url': 'https://example.com/1'},
                    {'title': f'{query} - 相关结果2', 'url': 'https://example.com/2'},
                    {'title': f'{query} - 相关结果3', 'url': 'https://example.com/3'}
                ],
                'total_results': random.randint(100, 10000)
            }
        
        return {'error': f'未知工具: {tool_name}'}
    
    def _generate_tool_response(self, tool_name: str, tool_result: Dict[str, Any]) -> str:
        """基于工具结果生成响应"""
        if tool_name == 'get_weather':
            if 'error' in tool_result:
                return f"抱歉，获取天气信息时出现错误：{tool_result['error']}"
            
            city = tool_result['city']
            temp = tool_result['temperature']
            condition = tool_result['condition']
            humidity = tool_result['humidity']
            wind = tool_result['wind_speed']
            
            return f"📍 {city}的天气情况：\n🌡️ 温度：{temp}°C\n☁️ 天气：{condition}\n💧 湿度：{humidity}%\n💨 风速：{wind}km/h"
        
        elif tool_name == 'calculate':
            if 'error' in tool_result:
                return f"计算出现错误：{tool_result['error']}"
            
            expression = tool_result['expression']
            result = tool_result['result']
            return f"🧮 计算结果：\n{expression} = {result}"
        
        elif tool_name == 'search_web':
            if 'error' in tool_result:
                return f"搜索出现错误：{tool_result['error']}"
            
            query = tool_result['query']
            results = tool_result['results']
            total = tool_result['total_results']
            
            response = f"🔍 搜索 '{query}' 的结果（共{total}条）：\n\n"
            for i, result in enumerate(results[:3], 1):
                response += f"{i}. {result['title']}\n   {result['url']}\n\n"
            
            return response.strip()
        
        return f"工具 {tool_name} 执行完成，结果：{json.dumps(tool_result, ensure_ascii=False, indent=2)}"
    
    async def _generate_qwen_response(self, message: str, response_type: str) -> str:
        """使用通义千问生成响应"""
        # 构建系统提示
        system_prompt = "你是AG-UI智能助手，一个基于AG-UI协议的AI助手。你需要：\n1. 提供有用、准确的回答\n2. 保持友好和专业的语调\n3. 根据用户需求提供相应的帮助\n4. 支持中文对话"
        
        # 根据响应类型调整系统提示
        if response_type == 'greeting':
            system_prompt += "\n当前是问候场景，请友好地打招呼并介绍你的功能。"
        elif response_type == 'help':
            system_prompt += "\n当前是帮助场景，请详细介绍你的功能和能力。"
        elif response_type == 'tool_demo':
            system_prompt += "\n当前是工具演示场景，请介绍可用的工具功能。"
        
        # 构建对话历史
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加最近的对话历史（最多5轮）
        recent_history = self.conversation_history[-10:] if len(self.conversation_history) > 10 else self.conversation_history
        for hist in recent_history:
            messages.append({
                "role": hist['role'],
                "content": hist['content']
            })
        
        # 添加当前用户消息
        messages.append({"role": "user", "content": message})
        
        print(f"📤 发送到通义千问的消息数量: {len(messages)}")
        print(f"📤 最后一条用户消息: {message[:50]}...")
        
        # 在异步环境中调用同步的OpenAI客户端
        loop = asyncio.get_event_loop()
        completion = await loop.run_in_executor(
            None,
            lambda: self.qwen_client.chat.completions.create(
                model="qwen-plus",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
        )
        
        response_content = completion.choices[0].message.content
        print(f"📥 通义千问响应长度: {len(response_content)} 字符")
        print(f"📥 响应内容预览: {response_content[:100]}...")
        
        return response_content
    
    async def _send_state_update(self) -> None:
        """发送状态更新"""
        await self.protocol.emit_event(EventType.STATE_SNAPSHOT, {
            'agent_state': self.agent_state.copy(),
            'conversation_length': len(self.conversation_history),
            'timestamp': time.time()
        })
    
    async def get_state(self) -> Dict[str, Any]:
        """获取当前状态"""
        return {
            'agent_state': self.agent_state.copy(),
            'conversation_history': self.conversation_history.copy(),
            'available_tools': list(self.available_tools.keys()),
            'timestamp': time.time()
        }
    
    async def reset_conversation(self) -> None:
        """重置对话"""
        self.conversation_history.clear()
        self.agent_state['status'] = 'ready'
        self.agent_state['last_activity'] = time.time()
        
        await self._send_state_update()
        
        # 发送重置通知
        await self.protocol.emit_event(EventType.CUSTOM, {
            'event_type': 'conversation_reset',
            'message': '对话已重置',
            'timestamp': time.time()
        })
    
    async def simulate_periodic_updates(self) -> None:
        """模拟周期性更新"""
        while True:
            await asyncio.sleep(30)  # 每30秒发送一次心跳
            
            # 发送心跳事件
            await self.protocol.emit_event(EventType.CUSTOM, {
                'event_type': 'heartbeat',
                'agent_status': self.agent_state['status'],
                'uptime': time.time() - self.agent_state.get('start_time', time.time()),
                'timestamp': time.time()
            })
    
    def start_periodic_updates(self) -> None:
        """启动周期性更新任务"""
        self.agent_state['start_time'] = time.time()
        asyncio.create_task(self.simulate_periodic_updates())
        print("🔄 代理周期性更新任务已启动")

# 使用示例
if __name__ == "__main__":
    async def test_simulator():
        from ag_ui_protocol import AGUIProtocol
        
        # 创建协议实例
        protocol = AGUIProtocol()
        
        # 创建代理模拟器
        simulator = AgentSimulator(protocol)
        
        # 注册事件处理器
        def on_event(event_type, data):
            print(f"📡 事件: {event_type}, 数据: {data}")
        
        protocol.on_event(on_event)
        
        # 测试消息处理
        test_messages = [
            "你好！",
            "帮助",
            "北京的天气怎么样？",
            "计算 2 + 3 * 4",
            "搜索 AG-UI协议"
        ]
        
        for message in test_messages:
            print(f"\n👤 用户: {message}")
            await simulator.process_user_message(message)
            await asyncio.sleep(1)
    
    # 运行测试
    asyncio.run(test_simulator())