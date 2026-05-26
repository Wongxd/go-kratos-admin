import type { Level } from '@tiptap/extension-heading';
import { mergeAttributes, Node } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { all, createLowlight } from 'lowlight';
import { marked } from 'marked';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, Modal, Select, Switch } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { isDarkMode } from './utils';

import './tiptap-editor.css';

export interface TiptapEditorProps {
  value: string;
  height?: number | string;
  disabled?: boolean;
  placeholder?: string;
  config?: Record<string, any>;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  uploadImage?: (file: File) => Promise<string>;
  fullHeight?: boolean;
  onChange?: (value: string) => void;
  onReady?: (editor: any) => void;
}

const lowlight = createLowlight(all);

// Custom CodeBlock with language selector
const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'javascript',
        parseHTML: (element: HTMLElement) => element.dataset.language,
        renderHTML: (attributes: Record<string, string>) => ({
          'data-language': attributes.language || 'javascript',
          class: `language-${attributes.language || 'javascript'}`,
        }),
      },
    };
  },
  addNodeView() {
    return ({ node, getPos, editor: editorInstance }) => {
      const dom = document.createElement('pre');
      const contentDOM = document.createElement('code');

      dom.dataset.language = node.attrs.language || 'javascript';
      dom.className = `language-${node.attrs.language || 'javascript'}`;

      // Language selector
      const selectorWrapper = document.createElement('div');
      selectorWrapper.className = 'code-block-language-selector';
      selectorWrapper.contentEditable = 'false';

      const select = document.createElement('select');
      select.contentEditable = 'false';

      const languageOptions = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'c', label: 'C' },
        { value: 'csharp', label: 'C#' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'php', label: 'PHP' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'swift', label: 'Swift' },
        { value: 'kotlin', label: 'Kotlin' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' },
        { value: 'scss', label: 'SCSS' },
        { value: 'json', label: 'JSON' },
        { value: 'yaml', label: 'YAML' },
        { value: 'sql', label: 'SQL' },
        { value: 'bash', label: 'Bash' },
        { value: 'shell', label: 'Shell' },
        { value: 'markdown', label: 'Markdown' },
        { value: 'plaintext', label: 'Plain Text' },
      ];

      languageOptions.forEach((lang) => {
        const option = document.createElement('option');
        option.value = lang.value;
        option.textContent = lang.label;
        if (lang.value === node.attrs.language) {
          option.selected = true;
        }
        select.append(option);
      });

      select.addEventListener('change', (e) => {
        const newLanguage = (e.target as HTMLSelectElement).value;
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (typeof pos === 'number') {
            editorInstance.view.dispatch(
              editorInstance.view.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                language: newLanguage,
              }),
            );
            dom.dataset.language = newLanguage;
            dom.className = `language-${newLanguage}`;
          }
        }
      });

      selectorWrapper.append(select);
      dom.append(selectorWrapper);
      dom.append(contentDOM);

      return {
        dom,
        contentDOM,
        update: (updatedNode: any) => {
          if (updatedNode.type !== node.type) {
            return false;
          }
          if (updatedNode.attrs.language !== node.attrs.language) {
            select.value = updatedNode.attrs.language;
            dom.dataset.language = updatedNode.attrs.language;
            dom.className = `language-${updatedNode.attrs.language}`;
          }
          return true;
        },
      };
    };
  },
}).configure({ lowlight, defaultLanguage: 'javascript' });

// Custom Video extension
const CustomVideo = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('src') },
      width: {
        default: '100%',
        parseHTML: (el: HTMLElement) => (el as HTMLElement).style.width || '100%',
      },
      height: {
        default: 'auto',
        parseHTML: (el: HTMLElement) => (el as HTMLElement).style.height || 'auto',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'video' }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'controls',
        style: 'max-width: 100%; height: auto;',
      }),
    ];
  },
  addCommands() {
    return {
      setVideo:
        (options: { height?: string; src: string; width?: string }) =>
        ({ commands }: { commands: any }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    } as any;
  },
});

// Custom Iframe extension
const CustomIframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('src') },
      width: {
        default: '100%',
        parseHTML: (el: HTMLElement) => (el as HTMLElement).style.width || '100%',
      },
      height: {
        default: '500px',
        parseHTML: (el: HTMLElement) => (el as HTMLElement).style.height || '500px',
      },
      title: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute('title') },
      allowfullscreen: {
        default: true,
        parseHTML: (el: HTMLElement) => el.hasAttribute('allowfullscreen'),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'iframe' }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        frameborder: '0',
        style: 'max-width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; margin: 12px 0;',
      }),
    ];
  },
  addCommands() {
    return {
      setIframe:
        (options: {
          allowfullscreen?: boolean;
          height?: string;
          src: string;
          title?: string;
          width?: string;
        }) =>
        ({ commands }: { commands: any }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    } as any;
  },
});

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
];

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  height = 500,
  disabled = false,
  placeholder,
  showToolbar = true,
  showStatusBar = true,
  uploadImage,
  onChange,
  onReady,
}) => {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(isDarkMode());
  const contentRef = useRef(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);

  // Modal states
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [codeBlockModalVisible, setCodeBlockModalVisible] = useState(false);
  const [codeBlockLanguage, setCodeBlockLanguage] = useState('javascript');
  const [codeBlockContent, setCodeBlockContent] = useState('');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoWidth, setVideoWidth] = useState('100%');
  const [iframeModalVisible, setIframeModalVisible] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [iframeWidth, setIframeWidth] = useState('100%');
  const [iframeHeight, setIframeHeight] = useState('500px');
  const [iframeTitle, setIframeTitle] = useState('');
  const [iframeAllowFullscreen, setIframeAllowFullscreen] = useState(true);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      HorizontalRule,
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      CustomCodeBlockLowlight,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || '' }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: true }),
      CustomVideo,
      CustomIframe,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable: !disabled,
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'prose dark:prose-invert focus:outline-none min-h-full' },
    },
    onCreate: ({ editor: e }) => {
      onReady?.(e);
    },
    onUpdate: ({ editor: e }) => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      const html = e.getHTML();
      contentRef.current = html;
      onChange?.(html);
    },
  });

  // Sync external value
  useEffect(() => {
    if (editor && value !== contentRef.current) {
      isInternalUpdate.current = true;
      editor.commands.setContent(value);
      contentRef.current = value;
    }
  }, [value, editor]);

  // Disabled changes
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Dark mode tracking
  useEffect(() => {
    const checkDark = () => setIsDark(isDarkMode());
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Toolbar actions
  const isActive = useCallback(
    (name: string, options?: any) => {
      return editor?.isActive(name, options) || false;
    },
    [editor],
  );

  const toolbarActions = useMemo(
    () => ({
      toggleBold: () => editor?.chain().focus().toggleBold().run(),
      toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
      toggleStrike: () => editor?.chain().focus().toggleStrike().run(),
      toggleUnderline: () => editor?.chain().focus().toggleUnderline().run(),
      toggleCode: () => editor?.chain().focus().toggleCode().run(),
      toggleHeading: (level: Level) => editor?.chain().focus().toggleHeading({ level }).run(),
      toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
      toggleTaskList: () => editor?.chain().focus().toggleTaskList().run(),
      insertCodeBlock: () => {
        setCodeBlockLanguage('javascript');
        setCodeBlockContent('');
        setCodeBlockModalVisible(true);
      },
      toggleBlockquote: () => editor?.chain().focus().toggleBlockquote().run(),
      toggleSubscript: () => editor?.chain().focus().toggleSubscript().run(),
      toggleSuperscript: () => editor?.chain().focus().toggleSuperscript().run(),
      setParagraph: () => editor?.chain().focus().setParagraph().run(),
      clearFormatting: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
      insertHorizontalRule: () => editor?.chain().focus().setHorizontalRule().run(),
      insertTable: () =>
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      deleteTable: () => editor?.chain().focus().deleteTable().run(),
      addRowBefore: () => editor?.chain().focus().addRowBefore().run(),
      addRowAfter: () => editor?.chain().focus().addRowAfter().run(),
      deleteRow: () => editor?.chain().focus().deleteRow().run(),
      addColumnBefore: () => editor?.chain().focus().addColumnBefore().run(),
      addColumnAfter: () => editor?.chain().focus().addColumnAfter().run(),
      deleteColumn: () => editor?.chain().focus().deleteColumn().run(),
      mergeCells: () => editor?.chain().focus().mergeCells().run(),
      splitCell: () => editor?.chain().focus().splitCell().run(),
      toggleHeaderRow: () => editor?.chain().focus().toggleHeaderRow().run(),
      toggleHeaderColumn: () => editor?.chain().focus().toggleHeaderColumn().run(),
      toggleHeaderCell: () => editor?.chain().focus().toggleHeaderCell().run(),
      setAlign: (align: 'center' | 'justify' | 'left' | 'right') =>
        editor?.chain().focus().setTextAlign(align).run(),
      setTextColor: (color: string) => editor?.chain().focus().setColor(color).run(),
      setHighlight: (color: string) => editor?.chain().focus().toggleHighlight({ color }).run(),
      uploadImage: () => fileInputRef.current?.click(),
      insertVideo: () => {
        setVideoUrl('');
        setVideoWidth('100%');
        setVideoModalVisible(true);
      },
      insertIframe: () => {
        setIframeUrl('');
        setIframeWidth('100%');
        setIframeHeight('500px');
        setIframeTitle('');
        setIframeAllowFullscreen(true);
        setIframeModalVisible(true);
      },
      importMarkdown: () => markdownInputRef.current?.click(),
      undo: () => editor?.chain().focus().undo().run(),
      redo: () => editor?.chain().focus().redo().run(),
      clearContent: () => {
        Modal.confirm({
          title: t('common.confirm', '确认'),
          icon: <ExclamationCircleOutlined />,
          content: t('editor:clear_content_confirm', '确定要清空所有内容吗？'),
          okText: t('common.confirm', '确定'),
          cancelText: t('common.cancel', '取消'),
          onOk() {
            editor?.commands.setContent('');
          },
        });
      },
    }),
    [editor, t],
  );

  // Image upload
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !uploadImage) return;
      try {
        const url = await uploadImage(file);
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        console.error('Image upload failed:', error);
      } finally {
        event.target.value = '';
      }
    },
    [uploadImage, editor],
  );

  const handleMarkdownImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const md = await file.text();
        const html = marked.parse(md);
        if (editor) {
          editor.commands.setContent(String(html));
        }
      } catch (error) {
        console.error('Markdown import failed:', error);
      } finally {
        event.target.value = '';
      }
    },
    [editor],
  );

  // Modal handlers
  const handleLinkOk = useCallback(() => {
    const url = linkUrl.trim();
    if (url && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkModalVisible(false);
    setLinkUrl('');
  }, [linkUrl, editor]);

  const handleCodeBlockOk = useCallback(() => {
    const code = codeBlockContent.trim();
    if (code && editor) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'codeBlock',
          attrs: { language: codeBlockLanguage },
          content: [{ type: 'text', text: code }],
        })
        .run();
    }
    setCodeBlockModalVisible(false);
    setCodeBlockContent('');
  }, [codeBlockContent, codeBlockLanguage, editor]);

  const handleVideoOk = useCallback(() => {
    const url = videoUrl.trim();
    if (url && editor) {
      (editor.chain().focus() as any).setVideo({ src: url, width: videoWidth }).run();
    }
    setVideoModalVisible(false);
  }, [videoUrl, videoWidth, editor]);

  const handleIframeOk = useCallback(() => {
    const url = iframeUrl.trim();
    if (url && editor) {
      (editor.chain().focus() as any)
        .setIframe({
          src: url,
          width: iframeWidth,
          height: iframeHeight,
          title: iframeTitle || undefined,
          allowfullscreen: iframeAllowFullscreen,
        })
        .run();
    }
    setIframeModalVisible(false);
  }, [iframeUrl, iframeWidth, iframeHeight, iframeTitle, iframeAllowFullscreen, editor]);

  // Status info
  const statusInfo = useMemo(() => {
    if (!editor) return { chars: 0, words: 0, cursor: '0:0' };
    const text = editor.getText();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const { from } = editor.state.selection;
    const doc = editor.state.doc;
    let col = 1;
    let line = 1;
    let pos = 1;
    doc.descendants((node) => {
      if (node.isText) {
        const t = node.text || '';
        for (const ch of t) {
          if (pos === from) return false;
          if (ch === '\n') {
            line++;
            col = 1;
          } else {
            col++;
          }
          pos++;
        }
      }
      return true;
    });
    return { chars, words, cursor: `${line}:${col}` };
  }, [editor, editor?.state.selection]);

  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`tiptap-editor-wrapper${isDark ? ' tiptap-editor-dark' : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
      style={{ height: containerHeight }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="tiptap-toolbar">
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('heading', { level: 1 }) ? ' active' : ''}`}
              onClick={() => toolbarActions.toggleHeading(1)}
              title="H1"
            >
              H1
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('heading', { level: 2 }) ? ' active' : ''}`}
              onClick={() => toolbarActions.toggleHeading(2)}
              title="H2"
            >
              H2
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('heading', { level: 3 }) ? ' active' : ''}`}
              onClick={() => toolbarActions.toggleHeading(3)}
              title="H3"
            >
              H3
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('paragraph') ? ' active' : ''}`}
              onClick={toolbarActions.setParagraph}
              title="P"
            >
              P
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('bold') ? ' active' : ''}`}
              onClick={toolbarActions.toggleBold}
              title={t('editor:bold', '粗体')}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('italic') ? ' active' : ''}`}
              onClick={toolbarActions.toggleItalic}
              title={t('editor:italic', '斜体')}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('strike') ? ' active' : ''}`}
              onClick={toolbarActions.toggleStrike}
              title={t('editor:strike', '删除线')}
            >
              <s>S</s>
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('underline') ? ' active' : ''}`}
              onClick={toolbarActions.toggleUnderline}
              title={t('editor:underline', '下划线')}
            >
              <u>U</u>
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('code') ? ' active' : ''}`}
              onClick={toolbarActions.toggleCode}
              title={t('editor:code', '代码')}
            >
              &lt;/&gt;
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('subscript') ? ' active' : ''}`}
              onClick={toolbarActions.toggleSubscript}
              title={t('editor:subscript', '下标')}
            >
              X₂
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('superscript') ? ' active' : ''}`}
              onClick={toolbarActions.toggleSuperscript}
              title={t('editor:superscript', '上标')}
            >
              X²
            </button>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                toolbarActions.setTextColor(e.target.value);
              }}
              className="toolbar-color-picker"
              title={t('editor:textColor', '文字颜色')}
            />
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => {
                setHighlightColor(e.target.value);
                toolbarActions.setHighlight(e.target.value);
              }}
              className="toolbar-color-picker"
              title={t('editor:highlightColor', '高亮颜色')}
            />
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('bulletList') ? ' active' : ''}`}
              onClick={toolbarActions.toggleBulletList}
              title={t('editor:bulletList', '无序列表')}
            >
              •≡
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('orderedList') ? ' active' : ''}`}
              onClick={toolbarActions.toggleOrderedList}
              title={t('editor:orderedList', '有序列表')}
            >
              1.
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('taskList') ? ' active' : ''}`}
              onClick={toolbarActions.toggleTaskList}
              title={t('editor:taskList', '任务列表')}
            >
              ☑
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('blockquote') ? ' active' : ''}`}
              onClick={toolbarActions.toggleBlockquote}
              title={t('editor:blockquote', '引用')}
            >
              ❝
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('codeBlock') ? ' active' : ''}`}
              onClick={toolbarActions.insertCodeBlock}
              title={t('editor:insertCodeBlock', '代码块')}
            >
              {'{}'}
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.insertTable}
              title={t('editor:insertTable', '插入表格')}
            >
              ⊞
            </button>
            {isActive('table') && (
              <button
                type="button"
                className="toolbar-btn"
                style={{ color: '#ef4444' }}
                onClick={toolbarActions.deleteTable}
                title={t('editor:deleteTable', '删除表格')}
              >
                🗑
              </button>
            )}
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.insertHorizontalRule}
              title={t('editor:insertHorizontalRule', '水平线')}
            >
              —
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('textAlign', { textAlign: 'left' }) ? ' active' : ''}`}
              onClick={() => toolbarActions.setAlign('left')}
              title={t('editor:left', '左对齐')}
            >
              ⇐
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('textAlign', { textAlign: 'center' }) ? ' active' : ''}`}
              onClick={() => toolbarActions.setAlign('center')}
              title={t('editor:center', '居中')}
            >
              ⇔
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('textAlign', { textAlign: 'right' }) ? ' active' : ''}`}
              onClick={() => toolbarActions.setAlign('right')}
              title={t('editor:right', '右对齐')}
            >
              ⇒
            </button>
            <button
              type="button"
              className={`toolbar-btn${isActive('textAlign', { textAlign: 'justify' }) ? ' active' : ''}`}
              onClick={() => toolbarActions.setAlign('justify')}
              title={t('editor:justify', '两端对齐')}
            >
              ☰
            </button>
          </div>
          {isActive('table') && (
            <>
              <div className="toolbar-divider" />
              <div className="toolbar-group">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.addRowBefore}
                  title={t('editor:insertRowBefore', '上方插入行')}
                >
                  R+
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.addRowAfter}
                  title={t('editor:insertRowAfter', '下方插入行')}
                >
                  +R
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.deleteRow}
                  title={t('editor:deleteRow', '删除行')}
                >
                  R-
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.addColumnBefore}
                  title={t('editor:insertColBefore', '左侧插入列')}
                >
                  C+
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.addColumnAfter}
                  title={t('editor:insertColAfter', '右侧插入列')}
                >
                  +C
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.deleteColumn}
                  title={t('editor:deleteCol', '删除列')}
                >
                  C-
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.mergeCells}
                  title={t('editor:mergeCells', '合并单元格')}
                >
                  M
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.splitCell}
                  title={t('editor:splitCell', '拆分单元格')}
                >
                  S
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.toggleHeaderRow}
                  title={t('editor:toggleHeaderRow', '切换表头行')}
                >
                  HR
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.toggleHeaderColumn}
                  title={t('editor:toggleHeaderColumn', '切换表头列')}
                >
                  HC
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={toolbarActions.toggleHeaderCell}
                  title={t('editor:toggleHeaderCell', '切换表头单元格')}
                >
                  H
                </button>
              </div>
            </>
          )}
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.undo}
              disabled={!editor?.can().undo()}
              title={t('editor:undo', '撤销')}
            >
              ↶
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.redo}
              disabled={!editor?.can().redo()}
              title={t('editor:redo', '重做')}
            >
              ↷
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.clearFormatting}
              title={t('editor:clearFormatting', '清除格式')}
            >
              A̶
            </button>
            <button
              type="button"
              className="toolbar-btn"
              style={{ color: '#ef4444' }}
              onClick={toolbarActions.clearContent}
              title={t('editor:clearContent', '清空内容')}
            >
              🗑
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              type="button"
              className={`toolbar-btn${isActive('link') ? ' active' : ''}`}
              onClick={() =>
                isActive('link')
                  ? editor?.chain().focus().unsetLink().run()
                  : setLinkModalVisible(true)
              }
              title={
                isActive('link')
                  ? t('editor:removeUrl', '移除链接')
                  : t('editor:insertUrl', '插入链接')
              }
            >
              🔗
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.uploadImage}
              title={t('editor:uploadImage', '上传图片')}
            >
              🖼
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.insertVideo}
              title={t('editor:insertVideo', '插入视频')}
            >
              🎬
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.insertIframe}
              title={t('editor:insertIframe', '插入iframe')}
            >
              ⧉
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={toolbarActions.importMarkdown}
              title={t('editor:importMarkdown', '导入Markdown')}
            >
              MD
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <input
              ref={markdownInputRef}
              type="file"
              accept=".md,text/markdown"
              style={{ display: 'none' }}
              onChange={handleMarkdownImport}
            />
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="tiptap-editor-content-wrapper">
        <EditorContent
          editor={editor}
          className={`tiptap-editor-content${isDark ? ' dark' : ''}`}
        />
      </div>

      {/* Status Bar */}
      {showStatusBar && (
        <div className="tiptap-statusbar">
          <div className="status-info">
            <span className="status-item">
              {statusInfo.words} {t('editor:words', '词')}
            </span>
            <span className="status-divider">|</span>
            <span className="status-item">
              {statusInfo.chars} {t('editor:chars', '字符')}
            </span>
            <span className="status-divider">|</span>
            <span className="status-item">Ln {statusInfo.cursor}</span>
          </div>
          <div className="status-mode">
            <span className={`mode-badge${isDark ? ' mode-dark' : ''}`}>
              {isDark
                ? `🌙 ${t('preferences.theme.dark', '暗色')}`
                : `☀️ ${t('preferences.theme.light', '亮色')}`}
            </span>
          </div>
        </div>
      )}

      {/* Link Modal */}
      <Modal
        open={linkModalVisible}
        title={t('editor:insert_url', '插入链接')}
        onOk={handleLinkOk}
        onCancel={() => {
          setLinkModalVisible(false);
          setLinkUrl('');
          editor?.chain().focus().run();
        }}
        okText={t('common.confirm', '确定')}
        cancelText={t('common.cancel', '取消')}
        mask={{ closable: false }}
      >
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t('editor:input_url', '请输入URL')}
          onPressEnter={handleLinkOk}
          allowClear
        />
      </Modal>

      {/* Code Block Modal */}
      <Modal
        open={codeBlockModalVisible}
        title={t('editor:insertCodeBlock', '插入代码块')}
        onOk={handleCodeBlockOk}
        onCancel={() => {
          setCodeBlockModalVisible(false);
          setCodeBlockContent('');
        }}
        okText={t('common.confirm', '确定')}
        cancelText={t('common.cancel', '取消')}
        mask={{ closable: false }}
        width={600}
      >
        <div className="code-block-modal">
          <div className="modal-field">
            <label className="field-label">{t('editor:codeLanguage', '编程语言')}</label>
            <Select
              value={codeBlockLanguage}
              onChange={setCodeBlockLanguage}
              options={languages}
              style={{ width: '100%' }}
              showSearch
              placeholder={t('editor:selectLanguage', '选择语言')}
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:codeContent', '代码内容')}</label>
            <textarea
              value={codeBlockContent}
              onChange={(e) => setCodeBlockContent(e.target.value)}
              className="code-textarea"
              rows={10}
              placeholder={t('editor:codeContentPlaceholder', '请输入代码')}
            />
          </div>
        </div>
      </Modal>

      {/* Video Modal */}
      <Modal
        open={videoModalVisible}
        title={t('editor:insertVideo', '插入视频')}
        onOk={handleVideoOk}
        onCancel={() => setVideoModalVisible(false)}
        okText={t('common.confirm', '确定')}
        cancelText={t('common.cancel', '取消')}
        mask={{ closable: false }}
        width={500}
      >
        <div className="video-modal">
          <div className="modal-field">
            <label className="field-label">{t('editor:videoUrl', '视频URL')}</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={t('editor:videoUrlPlaceholder', '请输入视频URL')}
              onPressEnter={handleVideoOk}
              allowClear
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:videoWidth', '宽度')}</label>
            <Select
              value={videoWidth}
              onChange={setVideoWidth}
              options={[
                { value: '100%', label: '100%' },
                { value: '75%', label: '75%' },
                { value: '50%', label: '50%' },
                { value: '640px', label: '640px' },
                { value: '800px', label: '800px' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>

      {/* Iframe Modal */}
      <Modal
        open={iframeModalVisible}
        title={t('editor:insertIframe', '插入Iframe')}
        onOk={handleIframeOk}
        onCancel={() => setIframeModalVisible(false)}
        okText={t('common.confirm', '确定')}
        cancelText={t('common.cancel', '取消')}
        mask={{ closable: false }}
        width={500}
      >
        <div className="iframe-modal">
          <div className="modal-field">
            <label className="field-label">{t('editor:iframeUrl', 'Iframe URL')}</label>
            <Input
              value={iframeUrl}
              onChange={(e) => setIframeUrl(e.target.value)}
              placeholder={t('editor:iframeUrlPlaceholder', '请输入URL')}
              onPressEnter={handleIframeOk}
              allowClear
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:iframeWidth', '宽度')}</label>
            <Select
              value={iframeWidth}
              onChange={setIframeWidth}
              options={[
                { value: '100%', label: '100%' },
                { value: '75%', label: '75%' },
                { value: '50%', label: '50%' },
                { value: '640px', label: '640px' },
                { value: '800px', label: '800px' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:iframeHeight', '高度')}</label>
            <Select
              value={iframeHeight}
              onChange={setIframeHeight}
              options={[
                { value: '500px', label: '500px' },
                { value: '300px', label: '300px' },
                { value: '100%', label: '100%' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:iframeTitle', '标题')}</label>
            <Input
              value={iframeTitle}
              onChange={(e) => setIframeTitle(e.target.value)}
              placeholder={t('editor:iframeTitlePlaceholder', '请输入标题')}
              allowClear
            />
          </div>
          <div className="modal-field">
            <label className="field-label">{t('editor:allowFullscreen', '允许全屏')}</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Switch checked={iframeAllowFullscreen} onChange={setIframeAllowFullscreen} />
              <span>
                {iframeAllowFullscreen
                  ? t('editor:allowFullscreenEnabled', '已启用')
                  : t('editor:allowFullscreenDisabled', '已禁用')}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TiptapEditor;
