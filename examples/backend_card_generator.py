#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AG-UI协议卡片组件后端生成器示例
展示如何使用AG-UI协议在后端生成卡片组件的状态事件
"""

import json
import time
import uuid
from typing import Dict, Any, List
from dataclasses import dataclass, asdict
from enum import Enum

# 导入AG-UI协议类型（在实际项目中应该从ag_ui_protocol模块导入）
class EventType(str, Enum):
    """AG-UI事件类型枚举"""
    STATE_SNAPSHOT = "STATE_SNAPSHOT"
    STATE_DELTA = "STATE_DELTA"
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_END = "TOOL_CALL_END"
    TEXT_MESSAGE_START = "TEXT_MESSAGE_START"
    TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT"
    TEXT_MESSAGE_END = "TEXT_MESSAGE_END"
    STEP_STARTED = "STEP_STARTED"
    STEP_FINISHED = "STEP_FINISHED"
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"
    RUN_ERROR = "RUN_ERROR"

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
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

@dataclass
class StateSnapshotEvent(BaseEvent):
    """状态快照事件"""
    state: Dict[str, Any] = None
    
    def __post_init__(self):
        super().__post_init__()
        if self.state is None:
            self.state = {}

@dataclass
class StateDeltaEvent(BaseEvent):
    """状态增量事件"""
    delta: Dict[str, Any] = None
    
    def __post_init__(self):
        super().__post_init__()
        if self.delta is None:
            self.delta = {}

class CardStatus(str, Enum):
    """卡片状态枚举"""
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"

class CardType(str, Enum):
    """卡片类型枚举"""
    TASK = "task"
    TOOL_CALL = "tool_call"
    MESSAGE = "message"
    STEP = "step"
    ANALYSIS = "analysis"
    REPORT = "report"

class CardComponentGenerator:
    """卡片组件生成器"""
    
    def __init__(self):
        self.current_state = {
            "cards": {},
            "layout": {
                "columns": 3,
                "spacing": 16
            },
            "theme": {
                "primary_color": "#3b82f6",
                "success_color": "#10b981",
                "error_color": "#ef4444",
                "warning_color": "#f59e0b"
            }
        }
    
    def create_card(self, 
                   card_id: str = None,
                   title: str = "新任务",
                   content: str = "",
                   card_type: CardType = CardType.TASK,
                   status: CardStatus = CardStatus.PENDING,
                   progress: int = 0,
                   metadata: Dict[str, Any] = None) -> str:
        """创建新卡片"""
        
        if card_id is None:
            card_id = f"card_{uuid.uuid4().hex[:8]}"
        
        if metadata is None:
            metadata = {}
        
        card_data = {
            "id": card_id,
            "title": title,
            "content": content,
            "type": card_type.value,
            "status": status.value,
            "progress": progress,
            "created_at": time.time(),
            "updated_at": time.time(),
            "metadata": metadata
        }
        
        # 更新内部状态
        self.current_state["cards"][card_id] = card_data
        
        # 生成状态增量事件
        delta_event = StateDeltaEvent(
            event_type=EventType.STATE_DELTA,
            delta={
                "cards": {
                    card_id: card_data
                }
            }
        )
        
        return delta_event.to_json()
    
    def update_card_status(self, card_id: str, status: CardStatus, progress: int = None) -> str:
        """更新卡片状态"""
        
        if card_id not in self.current_state["cards"]:
            raise ValueError(f"卡片 {card_id} 不存在")
        
        # 准备更新数据
        update_data = {
            "status": status.value,
            "updated_at": time.time()
        }
        
        if progress is not None:
            update_data["progress"] = progress
        
        # 更新内部状态
        self.current_state["cards"][card_id].update(update_data)
        
        # 生成状态增量事件
        delta_event = StateDeltaEvent(
            event_type=EventType.STATE_DELTA,
            delta={
                "cards": {
                    card_id: update_data
                }
            }
        )
        
        return delta_event.to_json()
    
    def update_card_content(self, card_id: str, content: str, append: bool = False) -> str:
        """更新卡片内容"""
        
        if card_id not in self.current_state["cards"]:
            raise ValueError(f"卡片 {card_id} 不存在")
        
        if append:
            current_content = self.current_state["cards"][card_id].get("content", "")
            new_content = current_content + content
        else:
            new_content = content
        
        # 更新内部状态
        self.current_state["cards"][card_id]["content"] = new_content
        self.current_state["cards"][card_id]["updated_at"] = time.time()
        
        # 生成状态增量事件
        delta_event = StateDeltaEvent(
            event_type=EventType.STATE_DELTA,
            delta={
                "cards": {
                    card_id: {
                        "content": new_content,
                        "updated_at": time.time()
                    }
                }
            }
        )
        
        return delta_event.to_json()
    
    def remove_card(self, card_id: str) -> str:
        """移除卡片"""
        
        if card_id not in self.current_state["cards"]:
            raise ValueError(f"卡片 {card_id} 不存在")
        
        # 从内部状态中移除
        del self.current_state["cards"][card_id]
        
        # 生成状态增量事件（设置为null表示删除）
        delta_event = StateDeltaEvent(
            event_type=EventType.STATE_DELTA,
            delta={
                "cards": {
                    card_id: None
                }
            }
        )
        
        return delta_event.to_json()
    
    def get_full_state_snapshot(self) -> str:
        """获取完整状态快照"""
        
        snapshot_event = StateSnapshotEvent(
            event_type=EventType.STATE_SNAPSHOT,
            state=self.current_state.copy()
        )
        
        return snapshot_event.to_json()
    
    def simulate_task_workflow(self, task_name: str) -> List[str]:
        """模拟任务工作流，返回事件序列"""
        
        events = []
        
        # 1. 创建任务卡片
        card_id = f"task_{uuid.uuid4().hex[:8]}"
        events.append(self.create_card(
            card_id=card_id,
            title=task_name,
            content="任务已创建，等待执行...",
            card_type=CardType.TASK,
            status=CardStatus.PENDING
        ))
        
        # 2. 开始执行
        events.append(self.update_card_status(
            card_id, CardStatus.EXECUTING, progress=10
        ))
        
        events.append(self.update_card_content(
            card_id, "正在分析任务需求..."
        ))
        
        # 3. 进度更新
        for progress in [25, 50, 75]:
            events.append(self.update_card_status(
                card_id, CardStatus.EXECUTING, progress=progress
            ))
        
        # 4. 完成任务
        events.append(self.update_card_status(
            card_id, CardStatus.COMPLETED, progress=100
        ))
        
        events.append(self.update_card_content(
            card_id, "任务执行完成！"
        ))
        
        return events
    
    def simulate_tool_call_workflow(self, tool_name: str, args: Dict[str, Any]) -> List[str]:
        """模拟工具调用工作流"""
        
        events = []
        
        # 1. 创建工具调用卡片
        card_id = f"tool_{uuid.uuid4().hex[:8]}"
        events.append(self.create_card(
            card_id=card_id,
            title=f"工具调用: {tool_name}",
            content=f"参数: {json.dumps(args, ensure_ascii=False)}",
            card_type=CardType.TOOL_CALL,
            status=CardStatus.EXECUTING,
            metadata={
                "tool_name": tool_name,
                "arguments": args
            }
        ))
        
        # 2. 模拟执行过程
        events.append(self.update_card_content(
            card_id, "\n正在调用工具...", append=True
        ))
        
        # 3. 完成调用
        events.append(self.update_card_status(
            card_id, CardStatus.COMPLETED, progress=100
        ))
        
        events.append(self.update_card_content(
            card_id, "\n工具调用成功完成！", append=True
        ))
        
        return events

def demo_card_generation():
    """演示卡片生成功能"""
    
    print("=== AG-UI协议卡片组件生成器演示 ===")
    print()
    
    generator = CardComponentGenerator()
    
    # 1. 获取初始状态快照
    print("1. 初始状态快照:")
    print(generator.get_full_state_snapshot())
    print()
    
    # 2. 创建几个不同类型的卡片
    print("2. 创建数据分析卡片:")
    event = generator.create_card(
        title="数据分析任务",
        content="分析用户行为数据，生成洞察报告",
        card_type=CardType.ANALYSIS,
        status=CardStatus.PENDING
    )
    print(event)
    print()
    
    print("3. 创建消息卡片:")
    event = generator.create_card(
        title="系统通知",
        content="欢迎使用AG-UI协议卡片系统！",
        card_type=CardType.MESSAGE,
        status=CardStatus.COMPLETED,
        progress=100
    )
    print(event)
    print()
    
    # 3. 模拟任务工作流
    print("4. 模拟任务工作流:")
    task_events = generator.simulate_task_workflow("生成月度报告")
    for i, event in enumerate(task_events, 1):
        print(f"步骤 {i}:")
        print(event)
        print()
    
    # 4. 模拟工具调用工作流
    print("5. 模拟工具调用工作流:")
    tool_events = generator.simulate_tool_call_workflow(
        "database_query", 
        {"table": "users", "limit": 100}
    )
    for i, event in enumerate(tool_events, 1):
        print(f"工具调用步骤 {i}:")
        print(event)
        print()
    
    # 5. 最终状态快照
    print("6. 最终状态快照:")
    print(generator.get_full_state_snapshot())

if __name__ == "__main__":
    demo_card_generation()