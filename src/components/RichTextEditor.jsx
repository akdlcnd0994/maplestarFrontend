import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import { useEffect, useCallback } from 'react';
import { api } from '../services/api';

const FONT_FAMILIES = [
  { label: '기본', value: '' },
  { label: '맑은 고딕', value: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" },
  { label: '나눔고딕', value: "'NanumGothic', sans-serif" },
  { label: '나눔명조', value: "'NanumMyeongjo', serif" },
  { label: '궁서체', value: "'Gungsuh', serif" },
  { label: '고정폭', value: 'monospace' },
];

const FONT_SIZES = [
  { label: '크기', value: '' },
  { label: '10', value: '10px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '36', value: '36px' },
];

function ToolbarButton({ onClick, isActive, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`rich-toolbar-btn${isActive ? ' is-active' : ''}`}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, placeholder = '내용을 입력하세요' }) {
  const uploadImage = useCallback(async (file) => {
    try {
      const res = await api.uploadInlineImage(file);
      return res.data?.url || null;
    } catch {
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        'data-placeholder': placeholder,
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        if (imageItems.length === 0) return false;

        event.preventDefault();
        imageItems.forEach(item => {
          const file = item.getAsFile();
          if (!file) return;
          uploadImage(file).then(url => {
            if (url) view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src: url })
            ));
          });
        });
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos;
        imageFiles.forEach(file => {
          uploadImage(file).then(url => {
            if (!url) return;
            const node = view.state.schema.nodes.image.create({ src: url });
            const tr = view.state.tr;
            if (pos != null) tr.insert(pos, node);
            else tr.replaceSelectionWith(node);
            view.dispatch(tr);
          });
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  if (!editor) return null;

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';

  const handleFontFamily = (e) => {
    const value = e.target.value;
    if (!value) {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
  };

  const handleFontSize = (e) => {
    const value = e.target.value;
    if (!value) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(value).run();
    }
  };

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-editor-toolbar">
        <select
          className="rich-toolbar-select font-select"
          value={currentFontFamily}
          onChange={handleFontFamily}
          title="글꼴"
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          className="rich-toolbar-select size-select"
          value={currentFontSize}
          onChange={handleFontSize}
          title="글자 크기"
        >
          {FONT_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className="rich-toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="굵게 (Ctrl+B)">
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="기울임 (Ctrl+I)">
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="취소선">
          <s>S</s>
        </ToolbarButton>
        <span className="rich-toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="제목2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="제목3">
          H3
        </ToolbarButton>
        <span className="rich-toolbar-divider" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="불릿 목록">
          ≡
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="번호 목록">
          1≡
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="인용구">
          ❝
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
