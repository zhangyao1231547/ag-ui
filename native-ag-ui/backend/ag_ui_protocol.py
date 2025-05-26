#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AG-UI协议原生实现
基于AG-UI规范的事件类型和数据结构
"""

import json
import time
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, asdict


class EventType(str, Enum):
    """AG-UI事件类型枚举"""
    TEXT_MESSAGE_START = "TEXT_MESSAGE_START"
    TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT"
    TEXT_MESSAGE_END = "TEXT_MESSAGE_END"
    TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK"
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_ARGS = "TOOL_CALL_ARGS"
    TOOL_CALL_END = "TOOL_CALL_END"
    TOOL_CALL_CHUNK = "TOOL_CALL_CHUNK"
    STATE_SNAPSHOT = "STATE_SNAPSHOT"
    STATE_DELTA = "STATE_DELTA"
    MESSAGES_SNAPSHOT = "MESSAGES_SNAPSHOT"
    RAW = "RAW"
    CUSTOM = "CUSTOM"
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"
    RUN_ERROR = "RUN_ERROR"
    STEP_STARTED = "STEP_STARTED"
    STEP_FINISHED = "STEP_FINISHED"


@dataclass
class BaseEvent:
    """基础事件类"""
    event_type: str
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return asdict(self)
    
    def to_json(self) -> str:
        """转换为JSON字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False)

@dataclass
class TextMessageStartEvent:
    """文本消息开始事件"""
    event_type: str
    message_id: str
    role: str = 'assistant'
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
@dataclass
class TextMessageContentEvent:
    """文本消息内容事件"""
    event_type: str
    message_id: str
    content: str
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
@dataclass
class TextMessageEndEvent:
    """文本消息结束事件"""
    event_type: str
    message_id: str
    content: str = ''
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
@dataclass
class ToolCallStartEvent:
    """工具调用开始事件"""
    event_type: str
    call_id: str
    tool_name: str
    arguments: Dict[str, Any] = None
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.arguments is None:
            self.arguments = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
@dataclass
class ToolCallEndEvent:
    """工具调用结束事件"""
    event_type: str
    call_id: str
    result: Any = None
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
@dataclass
class StateSnapshotEvent:
    """状态快照事件"""
    event_type: str
    state: Dict[str, Any] = None
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.state is None:
            self.state = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


@dataclass
class StateDeltaEvent:
    """状态增量事件"""
    event_type: str
    delta: Dict[str, Any] = None
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.delta is None:
            self.delta = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

@dataclass
class RunStartedEvent:
    """运行开始事件"""
    event_type: str
    run_id: str
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

@dataclass
class RunFinishedEvent:
    """运行完成事件"""
    event_type: str
    run_id: str
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

@dataclass
class RunErrorEvent:
    """运行错误事件"""
    event_type: str
    run_id: str
    error: str
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

@dataclass
class CustomEvent:
    """自定义事件"""
    event_type: str
    data: Dict[str, Any] = None
    timestamp: float = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.data is None:
            self.data = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


class AGUIProtocol:
    """AG-UI协议处理器"""
    
    def __init__(self):
        self.event_handlers = {}
        self.state = {}
        self.messages = []
    
    def register_handler(self, event_type: EventType, handler):
        """注册事件处理器"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def emit_event(self, event: BaseEvent) -> str:
        """发送事件"""
        # 处理事件
        if event.type in self.event_handlers:
            for handler in self.event_handlers[event.type]:
                handler(event)
        
        # 更新内部状态
        if isinstance(event, StateSnapshotEvent):
            self.state = event.state
        elif isinstance(event, StateDeltaEvent):
            self.state.update(event.delta)
        
        return event.to_json()
    
    def create_text_message_events(self, message_id: str, content: str) -> List[BaseEvent]:
        """创建文本消息事件序列"""
        return [
            TextMessageStartEvent(event_type=EventType.TEXT_MESSAGE_START, message_id=message_id),
            TextMessageContentEvent(event_type=EventType.TEXT_MESSAGE_CONTENT, message_id=message_id, content=content),
            TextMessageEndEvent(event_type=EventType.TEXT_MESSAGE_END, message_id=message_id)
        ]
    
    async def emit_text_message_start(self, message_id: str, role: str = 'assistant') -> None:
        """发送文本消息开始事件"""
        event = TextMessageStartEvent(
            event_type=EventType.TEXT_MESSAGE_START,
            message_id=message_id,
            role=role
        )
        await self.emit_event(EventType.TEXT_MESSAGE_START, event.to_dict())
    
    async def emit_text_message_content(self, message_id: str, content: str) -> None:
        """发送文本消息内容事件"""
        event = TextMessageContentEvent(
            event_type=EventType.TEXT_MESSAGE_CONTENT,
            message_id=message_id,
            content=content
        )
        await self.emit_event(EventType.TEXT_MESSAGE_CONTENT, event.to_dict())
    
    async def emit_text_message_end(self, message_id: str) -> None:
        """发送文本消息结束事件"""
        event = TextMessageEndEvent(
            event_type=EventType.TEXT_MESSAGE_END,
            message_id=message_id
        )
        await self.emit_event(EventType.TEXT_MESSAGE_END, event.to_dict())
    
    def create_tool_call_events(self, tool_call_id: str, tool_name: str, 
                               args: Dict[str, Any], result: Any) -> List[Any]:
        """创建工具调用事件序列"""
        return [
            ToolCallStartEvent(
                event_type=EventType.TOOL_CALL_START,
                call_id=tool_call_id, 
                tool_name=tool_name,
                arguments=args
            ),
            ToolCallEndEvent(
                event_type=EventType.TOOL_CALL_END,
                call_id=tool_call_id, 
                result=result
            )
        ]
    
    def get_state(self) -> Dict[str, Any]:
        """获取当前状态"""
        return self.state.copy()
    
    def update_state(self, delta: Dict[str, Any]) -> StateDeltaEvent:
        """更新状态并返回增量事件"""
        event = StateDeltaEvent(delta=delta)
        self.emit_event(event)
        return event