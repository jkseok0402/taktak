import { useState, useRef, useEffect } from 'react';

interface PinInputProps {
  onComplete: (pin: string) => void;
}

export function PinInput({ onComplete }: PinInputProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // 첫 번째 입력란에 포커스
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // 한 자리 숫자만 허용
    if (!/^\d*$/.test(value)) return; // 숫자만 허용

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // 다음 입력란으로 포커스 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // PIN이 완성되면 콜백 호출
    if (index === 5 && value) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // 현재 입력란이 비어있고 Backspace를 누르면 이전 입력란으로 이동
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="password"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xl"
          maxLength={1}
        />
      ))}
    </div>
  );
} 