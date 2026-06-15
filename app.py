import streamlit as st
import pandas as pd
import json
import re
import base64
import ast
import hashlib
from openai import OpenAI
import speech_recognition as sr

# ==========================================
# 1. 初始化会话状态（核心数据库与重置计数器）
# ==========================================
if 'master_df' not in st.session_state:
    st.session_state.master_df = pd.DataFrame()
if 'processed_hashes' not in st.session_state:
    st.session_state.processed_hashes = set()
if 'cam_idx' not in st.session_state:
    st.session_state.cam_idx = 0  # 摄像头重置计数器

st.set_page_config(page_title="纸质转线上-连拍版", layout="wide")
st.title("🚀 全自动采集：传送带连拍模式")

# ==========================================
# 2. 侧边栏：配置与统计
# ==========================================
with st.sidebar:
    st.header("⚙️ 引擎配置")
    ALI_API_KEY = st.text_input("🔑 阿里百炼 API Key:", type="password")
    ALI_MODEL = st.text_input("🧠 视觉模型名称:", value="qwen-vl-max")
    
    st.markdown("---")
    st.header("📊 数据统计")
    if not st.session_state.master_df.empty:
        st.metric("累计采集样本", len(st.session_state.master_df['所属人员'].unique()))
        st.metric("累计总行数", len(st.session_state.master_df))
        
        csv = st.session_state.master_df.to_csv(index=False, encoding='utf-8-sig')
        st.download_button("📥 导出全量 Excel (CSV)", data=csv, file_name="全汇总报表.csv")
    
    if st.button("🗑️ 清空所有数据"):
        st.session_state.master_df = pd.DataFrame()
        st.session_state.processed_hashes = set()
        st.session_state.cam_idx += 1 # 重置摄像头
        st.rerun()

# ==========================================
# 3. 极简采集交互（带自动重置功能）
# ==========================================
col_cam, col_msg = st.columns([1, 1])

with col_cam:
    # 关键攻坚：使用动态 key，确保存入后摄像头立即归零
    picture = st.camera_input(
        "📸 点击拍照即存入数据库", 
        key=f"cam_{st.session_state.cam_idx}"
    )

with col_msg:
    audio = st.audio_input("🎤 语音输入姓名（识别后自动保持）")
    manual_name = st.text_input("✍️ 手动录入/修正姓名:")
    st.markdown("""
    **🔥 高效操作流：**
    1. 录音或打字输入当前人员姓名。
    2. 咔嚓拍照。
    3. **看到“入库成功”后，直接翻页再按拍照！** (无需点清除)
    """)

# ==========================================
# 4. 自动化入库流水线
# ==========================================
if picture and (audio or manual_name) and ALI_API_KEY:
    
    img_bytes = picture.getvalue()
    img_hash = hashlib.md5(img_bytes).hexdigest()

    # 只有当这张图没被存过时才启动 AI
    if img_hash not in st.session_state.processed_hashes:
        
        ali_client = OpenAI(api_key=ALI_API_KEY, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")

        with st.spinner("🧠 正在同步数据至看板..."):
            try:
                # --- A: 语音解码 ---
                person_info = manual_name
                if audio and not manual_name:
                    recognizer = sr.Recognizer()
                    try:
                        with sr.AudioFile(audio) as source:
                            audio_data = recognizer.record(source)
                        person_info = recognizer.recognize_google(audio_data, language="zh-CN")
                    except:
                        person_info = "未知人员"
                
                # --- B: 视觉识别 ---
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                prompt = f"提取表格输出JSON数组，必须含'所属人员'字段，值为'{person_info}'。"
                
                response = ali_client.chat.completions.create(
                    model=ALI_MODEL,
                    messages=[{"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}}
                    ]}]
                )
                
                # --- C: 自动入库并强制重置摄像头 ---
                raw_text = response.choices[0].message.content
                json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
                
                if json_match:
                    data = ast.literal_eval(json_match.group())
                    new_df = pd.DataFrame(data)
                    
                    # 存入主库
                    st.session_state.master_df = pd.concat([st.session_state.master_df, new_df], ignore_index=True)
                    # 记录指纹
                    st.session_state.processed_hashes.add(img_hash)
                    
                    st.toast(f"✅ {person_info} 入库成功！", icon="🎉")
                    
                    # 【核心攻坚点】：增加索引，强制摄像头回到初始拍照状态
                    st.session_state.cam_idx += 1
                    st.rerun()

            except Exception as e:
                st.error(f"⚠️ 解析中断: {e}")

# ==========================================
# 5. 实时汇总看板
# ==========================================
st.markdown("---")
if not st.session_state.master_df.empty:
    st.subheader("📋 实时汇总看板")
    st.dataframe(st.session_state.master_df, use_container_width=True)
else:
    st.info("💡 系统已就绪。输入姓名并拍照，开始全自动汇总。")