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
# 1. 初始化会话状态（数据库）
# ==========================================
if 'master_df' not in st.session_state:
    st.session_state.master_df = pd.DataFrame()
if 'processed_hashes' not in st.session_state:
    st.session_state.processed_hashes = set() # 用来记录已经存入库的照片指纹

st.set_page_config(page_title="全自动流水线-传送带模式", layout="wide")
st.title("🚀 纸质转线上：全自动“传送带”采集系统")

# ==========================================
# 2. 侧边栏：配置与导出
# ==========================================
with st.sidebar:
    st.header("⚙️ 系统引擎")
    ALI_API_KEY = st.text_input("🔑 阿里百炼 API Key:", type="password")
    ALI_MODEL = st.text_input("🧠 视觉模型名称:", value="qwen-vl-max")
    
    st.markdown("---")
    st.header("📊 数据统计")
    st.metric("累计采集样本", len(st.session_state.master_df['所属人员'].unique()) if not st.session_state.master_df.empty else 0)
    
    if st.button("🗑️ 彻底清空数据库"):
        st.session_state.master_df = pd.DataFrame()
        st.session_state.processed_hashes = set()
        st.rerun()
    
    if not st.session_state.master_df.empty:
        csv = st.session_state.master_df.to_csv(index=False, encoding='utf-8-sig')
        st.download_button("📥 导出全量 Excel", data=csv, file_name="全自动采集汇总.csv")

# ==========================================
# 3. 极简采集区
# ==========================================
col_cam, col_msg = st.columns([1, 1])

with col_cam:
    picture = st.camera_input("📸 拍完即入库，请直接翻页拍照")

with col_msg:
    audio = st.audio_input("🎤 录音说出姓名（拍照前/后均可）")
    manual_name = st.text_input("✍️ (选填) 手动补录姓名:")
    st.info("💡 操作指南：\n1. 录音/打字输入姓名\n2. 点击拍照按钮\n3. 系统自动识别并存入下方列表\n4. 翻页，重复上述动作")

# ==========================================
# 4. 全自动逻辑攻坚 (核心变化点)
# ==========================================
if picture and (audio or manual_name) and ALI_API_KEY:
    
    # 生成当前照片的唯一哈希指纹，防止重复存入
    img_bytes = picture.getvalue()
    img_hash = hashlib.md5(img_bytes).hexdigest()

    # 如果这个指纹不在已处理名单中，说明是新动作
    if img_hash not in st.session_state.processed_hashes:
        
        ali_client = OpenAI(api_key=ALI_API_KEY, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")

        with st.spinner("🤖 正在自动识别并入库..."):
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
                
                # --- B: 视觉解析 ---
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                prompt = f"提取表格输出JSON数组，必须含'所属人员'字段，值为'{person_info}'。确保数值格式。"
                
                response = ali_client.chat.completions.create(
                    model=ALI_MODEL,
                    messages=[{"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}}
                    ]}]
                )
                
                # --- C: 自动入库 ---
                raw_text = response.choices[0].message.content
                json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
                
                if json_match:
                    data = ast.literal_eval(json_match.group())
                    new_df = pd.DataFrame(data)
                    
                    # 关键动作：合并到主数据库
                    st.session_state.master_df = pd.concat([st.session_state.master_df, new_df], ignore_index=True)
                    # 记录指纹，防止重复
                    st.session_state.processed_hashes.add(img_hash)
                    
                    st.toast(f"✅ {person_info} 的数据已自动存入库！", icon="🎊")
                    # 强制刷新页面显示最新统计
                    st.rerun()

            except Exception as e:
                st.error(f"⚠️ 自动入库失败：{e}")

# ==========================================
# 5. 实时数据看板
# ==========================================
st.markdown("---")
if not st.session_state.master_df.empty:
    st.subheader("📋 实时汇总看板")
    # 展示最近存入的 10 条数据，让用户知道系统在动
    st.dataframe(st.session_state.master_df.tail(15), use_container_width=True)
    
    # 全局分析（自动更新）
    num_cols = st.session_state.master_df.select_dtypes(include=['number']).columns
    if not num_cols.empty:
        st.subheader("📊 实时趋势分析")
        st.line_chart(st.session_state.master_df.groupby('所属人员')[num_cols[0]].mean())
else:
    st.warning("⏳ 暂无数据。请开启摄像头拍照，系统将自动开始汇总。")