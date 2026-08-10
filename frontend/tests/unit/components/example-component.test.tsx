import { render, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';

export const TestComponent = (props: { timeToDone: number }) => {
  const [state, setState] = useState('Not done');
  useEffect(() => {
    const timer = setTimeout(() => {
      setState('Done');
    }, props.timeToDone);

    return () => {
      clearTimeout(timer);
    };
  }, [props.timeToDone]);
  return <div data-cy="state">{state}</div>;
};

describe('Example component', () => {
  it('should render correct html structure', async () => {
    const { container } = render(<TestComponent timeToDone={200} />);
    const state = container.querySelector('[data-cy="state"]');
    expect(state).toHaveTextContent('Not done');
    await waitFor(() => {
      expect(state).toHaveTextContent('Done');
    });
  });
});
