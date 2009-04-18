package org.xidea.el.operation.test;

import static org.junit.Assert.assertEquals;

import org.junit.Test;
import org.xidea.el.Expression;
import org.xidea.el.ExpressionFactory;
import org.xidea.el.ExpressionFactoryImpl;


public class MemberMethodTest {
	ExpressionFactory factory = new ExpressionFactoryImpl();

	@Test
	public void testEncodeURLComponentEL() throws Exception{
		System.out.println( factory.create("(123.4.intValue()+11)").evaluate(null));
		Expression el = factory.create("(1234).intValue() == 1234");
		Expression el2 = factory.create("(1234.intValue()) == 1234");
		assertEquals(true, el.evaluate(null));
		assertEquals(true, el2.evaluate(null));
	}
	
}