import { Hono } from 'hono';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', (c) => {
  const { id } = c.req.param();
  return c.json({ message: `You requested link with id: ${id}` });
});
