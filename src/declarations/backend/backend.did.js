export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const SubscriptionResult = IDL.Variant({
    'ok' : IDL.Record({
      'id' : IDL.Text,
      'userId' : IDL.Nat,
      'plan' : IDL.Text,
      'status' : IDL.Text,
      'createdAt' : IDL.Int,
    }),
    'err' : IDL.Text,
  });
  const UserSubscriptionResult = IDL.Variant({
    'ok' : IDL.Opt(IDL.Record({
      'id' : IDL.Text,
      'userId' : IDL.Nat,
      'plan' : IDL.Text,
      'status' : IDL.Text,
      'createdAt' : IDL.Int,
    })),
    'err' : IDL.Text,
  });
  return IDL.Service({
    'cancelSubscription' : IDL.Func([IDL.Text], [Result], []),
    'createCheckoutSession' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'getUserSubscription' : IDL.Func([IDL.Nat], [UserSubscriptionResult], ['query']),
    'verifySubscription' : IDL.Func([IDL.Text], [SubscriptionResult], []),
  });
};
export const init = ({ IDL }) => { return []; };