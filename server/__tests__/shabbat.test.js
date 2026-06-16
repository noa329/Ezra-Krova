const { shabbatGuard } = require('../middleware/shabbatGuard');

describe('shabbatGuard middleware', () => {
  const next = jest.fn();
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() on a weekday', () => {
    const mockDate = new Date('2024-03-13T10:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    shabbatGuard({}, res, next);
    expect(next).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('should return 403 on Saturday', () => {
    const mockDate = new Date('2024-03-16T12:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    shabbatGuard({}, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    jest.restoreAllMocks();
  });
});
