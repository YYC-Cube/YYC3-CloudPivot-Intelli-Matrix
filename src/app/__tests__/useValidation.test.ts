/**
 * useValidation.test.ts
 * ===================
 * 统一输入校验工具 - 单元测试（W2 P1）
 *
 * 测试策略：
 * - 6 个纯校验函数全分支（合法/非法/边界）
 * - validateFields 批量校验：11 种规则类型 + 首错截断 + 自定义消息
 * - useValidation hook：validateField/validateAll/clearError/clearAll/hasErrors
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ValidationRule } from '../hooks/useValidation';
import {
  useValidation,
  validateApiKey,
  validateFields,
  validateIp,
  validateModelName,
  validatePort,
  validateRange,
  validateUrl,
} from '../hooks/useValidation';

describe('validateUrl', () => {
  it('合法 http/https/ws/wss 通过', () => {
    expect(validateUrl('http://a.com')).toBeNull();
    expect(validateUrl('https://api.yyc3.top/v1')).toBeNull();
    expect(validateUrl('ws://localhost:9102')).toBeNull();
    expect(validateUrl('wss://stream.io')).toBeNull();
  });

  it('空值放行（由 required 规则处理）', () => {
    expect(validateUrl('')).toBeNull();
  });

  it('非 http 系协议拒绝', () => {
    expect(validateUrl('ftp://files.io')).toContain('协议');
    expect(validateUrl('javascript:alert(1)')).toContain('协议');
  });

  it('格式无效拒绝', () => {
    expect(validateUrl('not-a-url')).toContain('格式无效');
  });
});

describe('validateApiKey', () => {
  it('空值放行', () => {
    expect(validateApiKey('')).toBeNull();
  });

  it('长度不足 8 位拒绝', () => {
    expect(validateApiKey('ab12')).toContain('8 位');
    expect(validateApiKey('12345678')).toBeNull(); // 恰好 8 位通过
  });

  it('含空格拒绝', () => {
    expect(validateApiKey('abc def12')).toContain('空格');
  });

  it('合法 key 通过', () => {
    expect(validateApiKey('sk-abc123XYZ')).toBeNull();
  });
});

describe('validatePort', () => {
  it('数字与字符串均可', () => {
    expect(validatePort(8080)).toBeNull();
    expect(validatePort('8080')).toBeNull();
  });

  it('非数字拒绝', () => {
    expect(validatePort('abc')).toContain('数字');
    expect(validatePort(NaN)).toContain('数字');
  });

  it('范围 1-65535', () => {
    expect(validatePort(0)).toContain('1-65535');
    expect(validatePort(65536)).toContain('1-65535');
    expect(validatePort(1)).toBeNull();
    expect(validatePort(65535)).toBeNull();
  });
});

describe('validateIp', () => {
  it('空值放行', () => {
    expect(validateIp('')).toBeNull();
  });

  it('合法 IPv4 / CIDR / 多行通过', () => {
    expect(validateIp('192.168.1.1')).toBeNull();
    expect(validateIp('10.0.0.0/8')).toBeNull();
    expect(validateIp('192.168.1.1\n10.0.0.1')).toBeNull();
  });

  it('格式非法拒绝并带出行内容', () => {
    expect(validateIp('999.abc')).toContain('无效 IP/CIDR: 999.abc');
  });

  it('段超 255 拒绝', () => {
    expect(validateIp('256.1.1.1')).toContain('超出范围');
  });
});

describe('validateModelName', () => {
  it('空值放行', () => {
    expect(validateModelName('')).toBeNull();
  });

  it('超 128 字符拒绝', () => {
    expect(validateModelName('a'.repeat(129))).toContain('128');
    expect(validateModelName('a'.repeat(128))).toBeNull();
  });

  it('非法字符拒绝', () => {
    expect(validateModelName('model<x>')).toContain('非法字符');
    expect(validateModelName('a|b')).toContain('非法字符');
  });

  it('常规名称通过', () => {
    expect(validateModelName('gpt-4o:latest')).toBeNull();
  });
});

describe('validateRange', () => {
  it('数字与字符串均可', () => {
    expect(validateRange(5, 0, 10)).toBeNull();
    expect(validateRange('5.5', 0, 10)).toBeNull();
  });

  it('非数字拒绝', () => {
    expect(validateRange('abc')).toContain('数字');
  });

  it('min/max 边界', () => {
    expect(validateRange(5, 10)).toContain('小于 10');
    expect(validateRange(20, undefined, 10)).toContain('大于 10');
    expect(validateRange(10, 10, 10)).toBeNull();
  });
});

describe('validateFields 批量校验', () => {
  it('全部合法 → valid=true 且无错误', () => {
    const result = validateFields([
      { field: 'name', label: '名称', value: '服务A', rules: [{ type: 'required' }] },
      { field: 'port', label: '端口', value: 8080, rules: [{ type: 'port' }] },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.errorMap).toEqual({});
  });

  it.each([
    ['required', { type: 'required' } as const, '', '不能为空'],
    ['url', { type: 'url' } as const, 'bad://x', 'URL'],
    ['apiKey', { type: 'apiKey' } as const, 'short', 'API Key'],
    ['port', { type: 'port' } as const, '99999', '端口号'],
    ['ip', { type: 'ip' } as const, '300.1.1.1', 'IP'],
    ['modelName', { type: 'modelName' } as const, 'a<b', '非法字符'],
    ['range', { type: 'range', min: 10 } as const, 5, '小于'],
    ['minLength', { type: 'minLength', min: 3 } as const, 'ab', '最少 3 字符'],
    ['maxLength', { type: 'maxLength', max: 2 } as const, 'abc', '最多 2 字符'],
    ['pattern', { type: 'pattern', regex: /^\d+$/ } as const, 'abc', '格式不正确'],
    ['custom', { type: 'custom', validate: () => '自定义错误' } as const, 'x', '自定义错误'],
  ])('规则 %s 触发错误', (_type, rule, value, expected) => {
    const result = validateFields([
      { field: 'f', label: '字段F', value: value as string | number | boolean, rules: [rule] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain(expected);
    expect(result.errorMap.f).toContain(expected);
  });

  it('自定义消息优先于默认消息', () => {
    const result = validateFields([
      { field: 'p', label: '端口', value: 99999, rules: [{ type: 'port', message: '端口配错了' }] },
    ]);
    expect(result.errors[0].message).toBe('端口配错了');
  });

  it('每字段只报第一个错误（break 截断）', () => {
    const result = validateFields([
      {
        field: 'multi',
        label: '多规则',
        value: '',
        rules: [{ type: 'required' }, { type: 'minLength', min: 5 }],
      },
    ]);
    expect(result.errors).toHaveLength(1);
  });

  it('多字段错误聚合到 errorMap', () => {
    const result = validateFields([
      { field: 'a', label: 'A', value: '', rules: [{ type: 'required' }] },
      { field: 'b', label: 'B', value: '', rules: [{ type: 'required' }] },
      { field: 'c', label: 'C', value: 'ok', rules: [{ type: 'required' }] },
    ]);
    expect(result.errors).toHaveLength(2);
    expect(Object.keys(result.errorMap).sort()).toEqual(['a', 'b']);
  });
});

describe('useValidation hook', () => {
  it('初始无错误', () => {
    const { result } = renderHook(() => useValidation());
    expect(result.current.errors).toEqual({});
    expect(result.current.hasErrors).toBe(false);
  });

  it('validateField 失败时写入错误并返回 false', () => {
    const { result } = renderHook(() => useValidation());
    let ok: boolean = true;
    act(() => {
      ok = result.current.validateField('port', '端口', '99999', [{ type: 'port' }]);
    });
    expect(ok).toBe(false);
    expect(result.current.errors.port).toContain('端口号');
    expect(result.current.hasErrors).toBe(true);
  });

  it('validateField 通过时清除既有错误并返回 true', () => {
    const { result } = renderHook(() => useValidation());
    act(() => {
      result.current.validateField('port', '端口', '99999', [{ type: 'port' }]);
    });
    expect(result.current.hasErrors).toBe(true);

    let ok: boolean = false;
    act(() => {
      ok = result.current.validateField('port', '端口', '8080', [{ type: 'port' }]);
    });
    expect(ok).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('validateAll 批量校验替换全部错误状态', () => {
    const { result } = renderHook(() => useValidation());
    const rules: ValidationRule[] = [
      { field: 'a', label: 'A', value: '', rules: [{ type: 'required' }] },
      { field: 'b', label: 'B', value: '99999', rules: [{ type: 'port' }] },
    ];

    let ok: boolean = true;
    act(() => {
      ok = result.current.validateAll(rules);
    });
    expect(ok).toBe(false);
    expect(Object.keys(result.current.errors).sort()).toEqual(['a', 'b']);

    // 修正后重校验（a 补非空值，b 修正端口）
    act(() => {
      result.current.validateAll(rules.map((r) => ({ ...r, value: r.field === 'a' ? 'filled' : 8080 })));
    });
    expect(result.current.errors).toEqual({});
  });

  it('clearError 清除单字段', () => {
    const { result } = renderHook(() => useValidation());
    act(() => {
      result.current.validateAll([
        { field: 'a', label: 'A', value: '', rules: [{ type: 'required' }] },
        { field: 'b', label: 'B', value: '', rules: [{ type: 'required' }] },
      ]);
    });

    act(() => result.current.clearError('a'));
    expect(Object.keys(result.current.errors)).toEqual(['b']);
  });

  it('clearAll 清除全部', () => {
    const { result } = renderHook(() => useValidation());
    act(() => {
      result.current.validateAll([
        { field: 'a', label: 'A', value: '', rules: [{ type: 'required' }] },
      ]);
    });
    expect(result.current.hasErrors).toBe(true);

    act(() => result.current.clearAll());
    expect(result.current.hasErrors).toBe(false);
  });
});
