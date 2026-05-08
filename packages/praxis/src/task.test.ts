import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import { Task } from './task'

describe('Task', () => {
  describe('Task.create', () => {
    it('creates a task from a synchronous function that succeeds', async () => {
      const task = Task.create({ run: (x: number) => x * 2 })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('creates a task from a synchronous function that throws', async () => {
      const task = Task.create({
        run: (_x: number) => {
          throw new Error('fail')
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.is(result.right)).toBe(true)
      expect(result.right?.cause).toBeInstanceOf(Error)
    })

    it('creates a task from an async function', async () => {
      const task = Task.create({
        run: async (x: number) => {
          await Promise.resolve()

          return x + 1
        },
      })

      const result = await Task.run(task, 10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })

    it('preserves a Zygon returned from the raw function', async () => {
      const task = Task.create({
        run: (_x: number) => {
          return Zygon.right(new Error('expected failure'))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('handles optional input for undefined input type', async () => {
      const task = Task.create({ run: () => 42 })

      const result = await Task.run(task)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })
  })

  describe('Task.run', () => {
    it('runs a task and lifts the result on success', async () => {
      const task = Task.create({ run: (x: number) => x * 2 })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('runs a task and lifts the result on failure', async () => {
      const task = Task.create({
        run: (_x: number) => {
          throw new Error('fail')
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.is(result.right)).toBe(true)
    })

    it('lifts nested Zygon results', async () => {
      const task = Task.create({
        run: (_x: number) => {
          return Zygon.left(Zygon.left(42))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('lifts nested Zygon failure results', async () => {
      const task = Task.create({
        run: (_x: number) => {
          return Zygon.right(Zygon.right(new Error('nested fail')))
        },
      })

      const result = await Task.run(task, 21)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Zygon.is(result.right)).toBe(false)
    })
  })

  describe('Task branding', () => {
    it('creates a branded task', () => {
      const task = Task.create({ run: (x: number) => x })

      expect(Idion.is(task, Task.identifier)).toBe(true)
    })

    it('can distinguish between tasks and plain objects', () => {
      const task = Task.create({ run: (x: number) => x })
      const notTask = { runner: () => Promise.resolve(Zygon.left(42)) }

      expect(Idion.is(task, Task.identifier)).toBe(true)
      expect(Idion.is(notTask, Task.identifier)).toBe(false)
    })
  })

  describe('Task.abort', () => {
    it('aborts a task and sets the signal to aborted', () => {
      const task = Task.create({ run: () => 42 })

      expect(Task.aborted(task)).toBe(false)

      Task.abort(task)

      expect(Task.aborted(task)).toBe(true)
    })

    it('aborts a task with a custom reason', () => {
      const task = Task.create({ run: () => 42 })

      Task.abort(task, 'timeout')

      expect(Task.aborted(task)).toBe(true)
      expect(Task.controller(task).signal.reason).toBe('timeout')
    })
  })

  describe('Task.aborted', () => {
    it('returns false for a task that has not been aborted', () => {
      const task = Task.create({ run: () => 42 })

      expect(Task.aborted(task)).toBe(false)
    })

    it('returns true for a task that has been aborted', () => {
      const task = Task.create({ run: () => 42 })

      Task.abort(task)

      expect(Task.aborted(task)).toBe(true)
    })
  })

  describe('Task.controller', () => {
    it('returns the AbortController for a task', () => {
      const task = Task.create({ run: () => 42 })
      const controller = Task.controller(task)

      expect(controller).toBeInstanceOf(AbortController)
      expect(controller.signal.aborted).toBe(false)
    })

    it('returns the same controller reference on subsequent calls', () => {
      const task = Task.create({ run: () => 42 })

      const controller1 = Task.controller(task)
      const controller2 = Task.controller(task)

      expect(controller1).toBe(controller2)
    })
  })

  describe('Task abort during run', () => {
    it('returns an aborted RuntimePtoma when task is aborted during execution', async () => {
      const task = Task.create({
        run: async () => {
          Task.abort(task, 'interrupted')

          await Promise.resolve()

          return 42
        },
      })

      const result = await Task.run(task)

      expect(Zygon.isRight(result)).toBe(true)
      expect(Ptoma.is(result.right)).toBe(true)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('preserves the abort reason when aborted during execution', async () => {
      const task = Task.create({
        run: async () => {
          Task.abort(task, 'timeout exceeded')

          await Promise.resolve()

          return 'success'
        },
      })

      const result = await Task.run(task)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right?.cause).toBe('timeout exceeded')
    })

    it('can be aborted from outside while task is running', async () => {
      let resolvePromise: () => void

      const blocker = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      const task = Task.create({
        run: async () => {
          await blocker

          return 'completed'
        },
      })

      const runPromise = Task.run(task)

      Task.abort(task, 'external abort')

      // biome-ignore lint: it's okay here
      resolvePromise!()

      const result = await runPromise

      expect(Zygon.isRight(result)).toBe(true)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
      expect(result.right?.cause).toBe('external abort')
    })

    it('succeeds when not aborted', async () => {
      const task = Task.create({ run: () => 'success' })

      const result = await Task.run(task)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('success')
    })
  })

  describe('Task.isInternal', () => {
    it('returns true for a newly created task (neutral state)', () => {
      const task = Task.create({ run: () => 42 })

      expect(Task.isInternal(task)).toBe(true)
    })

    it('returns true after internalized is called', () => {
      const task = Task.create({ run: () => 42 })

      Task.internalized(task)

      expect(Task.isInternal(task)).toBe(true)
    })

    it('returns false after externalized is called', () => {
      const task = Task.create({ run: () => 42 })

      Task.externalized(task)

      expect(Task.isInternal(task)).toBe(false)
    })

    it('returns false after internalized then externalized', () => {
      const task = Task.create({ run: () => 42 })

      Task.internalized(task)
      Task.externalized(task)

      expect(Task.isInternal(task)).toBe(false)
    })
  })

  describe('Task.isExternal', () => {
    it('returns false for a newly created task (neutral state)', () => {
      const task = Task.create({ run: () => 42 })

      expect(Task.isExternal(task)).toBe(false)
    })

    it('returns true after externalized is called', () => {
      const task = Task.create({ run: () => 42 })

      Task.externalized(task)

      expect(Task.isExternal(task)).toBe(true)
    })

    it('returns false after internalized is called', () => {
      const task = Task.create({ run: () => 42 })

      Task.internalized(task)

      expect(Task.isExternal(task)).toBe(false)
    })

    it('returns true after externalized then internalized then externalized', () => {
      const task = Task.create({ run: () => 42 })

      Task.externalized(task)
      Task.internalized(task)
      Task.externalized(task)

      expect(Task.isExternal(task)).toBe(true)
    })
  })

  describe('Task.internalized', () => {
    it('marks a task as internal', () => {
      const task = Task.create({ run: () => 42 })

      Task.internalized(task)

      expect(Task.isInternal(task)).toBe(true)
      expect(Task.isExternal(task)).toBe(false)
    })
  })

  describe('Task.externalized', () => {
    it('marks a task as external', () => {
      const task = Task.create({ run: () => 42 })

      Task.externalized(task)

      expect(Task.isExternal(task)).toBe(true)
      expect(Task.isInternal(task)).toBe(false)
    })

    it('uses the AbortController provided in Task.create when running', async () => {
      const controller = new AbortController()
      const task = Task.create({
        run: () => 42,
        controller,
      })

      Task.externalized(task)

      const controllerBeforeRun = Task.controller(task)

      await Task.run(task)

      const controllerAfterRun = Task.controller(task)

      expect(controllerBeforeRun).toBe(controller)
      expect(controllerAfterRun).toBe(controller)
    })

    it('does not create a new AbortController when running an external task', async () => {
      const controller = new AbortController()
      const task = Task.create({
        run: () => 42,
        controller,
      })

      Task.externalized(task)

      await Task.run(task)

      expect(Task.controller(task)).toBe(controller)
    })

    it('respects pre-aborted external controller', async () => {
      const controller = new AbortController()
      const task = Task.create({
        run: () => 42,
        controller,
      })

      Task.externalized(task)
      controller.abort('pre-aborted')

      const result = await Task.run(task)

      expect(Zygon.isRight(result)).toBe(true)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
      expect(result.right?.cause).toBe('pre-aborted')
    })
  })

  describe('Task.RuntimePtoma', () => {
    it('creates a RuntimePtoma with correct type', () => {
      const ptoma = new Task.RuntimePtoma('test', undefined, {
        cause: new Error('oops'),
      })

      expect(Ptoma.is(ptoma)).toBe(true)
      expect(ptoma.name).toBe('@herodot-app/praxis/task/runtime-ptoma')
    })

    it('uses static properties for error messages', () => {
      expect(
        Task.RuntimePtoma.isRun(new Task.RuntimePtoma(Task.RuntimePtoma.RUN)),
      ).toBe(true)

      expect(
        Task.RuntimePtoma.isLiftLeft(
          new Task.RuntimePtoma(Task.RuntimePtoma.LIFT_LEFT),
        ),
      ).toBe(true)

      expect(
        Task.RuntimePtoma.isLiftRight(
          new Task.RuntimePtoma(Task.RuntimePtoma.LIFT_RIGHT),
        ),
      ).toBe(true)

      expect(
        Task.RuntimePtoma.isAborted(
          new Task.RuntimePtoma(Task.RuntimePtoma.ABORTED),
        ),
      ).toBe(true)
    })
  })
})
